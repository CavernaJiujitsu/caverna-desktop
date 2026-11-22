import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MembershipsPage from '@/features/memberships/pages/memberships-page'
import { http } from '@/shared/lib/axios'
import { notify } from '@/shared/lib/notifications'
import { SessionProvider } from '@/shared/session/session-context'
import { writeStoredSession } from '@/shared/session/session-storage'

// Real hooks, services and Zod schemas; only the HTTP transport is replaced,
// so the roster is driven by API-shaped payloads.
vi.mock('@/shared/lib/axios', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/axios')>()),
  http: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/shared/lib/notifications', () => ({
  notify: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const units = vi.hoisted(() => ({ useAllManagedCaveUnits: vi.fn() }))
vi.mock('@/features/academies/hooks/use-academies', () => ({
  useAllManagedCaveUnits: units.useAllManagedCaveUnits,
}))
vi.mock('@/features/platform/hooks/use-platform-caves', () => ({
  usePlatformCaves: () => ({ isPending: false, isError: false, data: [] }),
}))

const CAVE_ID = '9157d890-613d-43b8-960a-b090a7af17e2'
const UNIT_ID = '05683939-5e63-4ba4-90b2-7f29007cc0ae'
const PRACTITIONER_ID = '03ab11c3-5b0e-4d8e-b60d-1cf7887144b0'
const ROSTER_URL = `/memberships/students/cave-units/${UNIT_ID}/practitioners`
const UNLINK_URL = `/memberships/students/cave-units/${PRACTITIONER_ID}/${UNIT_ID}`

// GET /memberships/students/cave-units/:id/practitioners (unit "Centro"),
// copied from the local API (17/11, 09:56).
const rosterMembership = {
  id: 'c1bd028d-e338-4507-9d63-fc9141754841',
  createdAt: '2026-11-17T03:36:50.830Z',
  updatedAt: '2026-11-17T03:36:50.830Z',
  createdBy: null,
  active: true,
  joinedAt: '2026-11-17T03:36:50.829Z',
  practitioner: {
    id: PRACTITIONER_ID,
    createdAt: '2026-11-17T03:36:50.825Z',
    updatedAt: '2026-11-17T03:36:50.825Z',
    createdBy: null,
    age: null,
    latitude: null,
    longitude: null,
    user: {
      id: 'fd00ffe1-3637-4ecd-92f6-bd4109acb53f',
      createdAt: '2026-11-17T03:36:50.819Z',
      updatedAt: '2026-11-17T09:23:47.897Z',
      createdBy: null,
      name: 'Aluno Demo',
      email: 'aluno.demo@caverna.com',
      role: 'STUDENT',
      photoKey: null,
    },
  },
}

function rosterResponse(memberships: unknown[]) {
  return {
    message: 'Praticantes vinculados listados',
    data: memberships,
    timestamp: '2026-11-17T09:56:18.091Z',
  }
}

// GET /practitioners?page=1&caveId=<Caverna Matriz>&limit=20 (17/11, 10:05),
// keeping only the seeded student.
const studentsResponse = {
  message: 'Praticantes listados',
  data: {
    data: [
      {
        id: PRACTITIONER_ID,
        createdAt: '2026-11-17T03:36:50.825Z',
        updatedAt: '2026-11-17T03:36:50.825Z',
        createdBy: null,
        age: null,
        latitude: null,
        longitude: null,
        user: {
          id: 'fd00ffe1-3637-4ecd-92f6-bd4109acb53f',
          createdAt: '2026-11-17T03:36:50.819Z',
          updatedAt: '2026-11-17T09:23:47.897Z',
          createdBy: null,
          name: 'Aluno Demo',
          email: 'aluno.demo@caverna.com',
          role: 'STUDENT',
        },
        currentBelt: null,
        units: [
          {
            id: UNIT_ID,
            name: 'Centro',
            caveId: CAVE_ID,
            caveName: 'Caverna Matriz',
          },
          {
            id: '0705f03d-a079-4ae6-80ea-899e31adc123',
            name: 'Brasilândia',
            caveId: '316ba6d1-0277-4727-a042-411b5adaee15',
            caveName: 'Caverna Brasilândia',
          },
        ],
      },
    ],
    _meta: { page: 1, totalPage: 1, total: 1 },
    _links: {},
  },
  timestamp: '2026-11-17T10:05:56.306Z',
}

// Body built by StudentMembershipsService.unlinkPractitionerFromCaveUnit.
const unlinkResponse = {
  message: 'Praticante desvinculado da unidade',
  data: { id: PRACTITIONER_ID },
  timestamp: '2026-11-17T10:10:00.000Z',
}

function apiError(status: number, message: string, path: string) {
  return new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    { headers: new AxiosHeaders() },
    undefined,
    {
      data: { message, timestamp: '2026-11-17T10:00:47.700Z', path },
      status,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  )
}

/** Active links the API currently returns for the unit (C2: only active). */
let serverRoster: unknown[]

function getCalls(url: string) {
  return vi.mocked(http.get).mock.calls.filter(([called]) => called === url)
}

function renderPage() {
  writeStoredSession({
    session: {
      user: {
        id: 'user-cave-admin',
        email: 'admin.caverna@caverna.com',
        name: 'Admin',
      },
      accessToken: 'token',
      expiresAt: Date.now() + 7_200_000,
      roles: ['CAVE_ADMIN'],
      caveId: CAVE_ID,
    },
    selectedContext: {
      id: `academy:${CAVE_ID}`,
      role: 'academy',
      label: 'Caverna Matriz',
      detail: 'Gestão da caverna',
      caveId: CAVE_ID,
    },
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/memberships']}>
        <SessionProvider>
          <MembershipsPage />
        </SessionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function openUnitRoster() {
  await userEvent.selectOptions(
    await screen.findByRole('combobox', { name: 'Unidade' }),
    UNIT_ID,
  )
  return screen.findByRole('list', { name: 'Alunos da unidade' })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  serverRoster = [rosterMembership]
  units.useAllManagedCaveUnits.mockReturnValue({
    isPending: false,
    isError: false,
    data: [{ id: UNIT_ID, name: 'Centro', neighborhood: null, active: true }],
    refetch: vi.fn(),
  })
  vi.mocked(http.get).mockImplementation(async (url) => {
    if (url === ROSTER_URL) return { data: rosterResponse(serverRoster) }
    if (url === '/practitioners') return { data: studentsResponse }
    throw new Error(`Unexpected GET ${url}`)
  })
})

afterEach(() => vi.restoreAllMocks())

describe('unit roster', () => {
  it('shows the empty state when the unit has no active link', async () => {
    serverRoster = []
    renderPage()

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Unidade' }),
      UNIT_ID,
    )

    expect(
      await screen.findByText('Nenhum aluno vinculado'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Desvincular' }),
    ).not.toBeInTheDocument()
  })

  it('shows the API error with a retry instead of an empty roster', async () => {
    vi.mocked(http.get).mockImplementation(async (url) => {
      if (url === ROSTER_URL)
        throw apiError(404, 'Unidade não encontrada', `/api/v1${ROSTER_URL}`)
      return { data: studentsResponse }
    })
    renderPage()

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Unidade' }),
      UNIT_ID,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unidade não encontrada',
    )
    expect(screen.queryByText('Nenhum aluno vinculado')).not.toBeInTheDocument()

    vi.mocked(http.get).mockImplementation(async () => ({
      data: rosterResponse(serverRoster),
    }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    )
    const roster = await screen.findByRole('list', {
      name: 'Alunos da unidade',
    })
    expect(within(roster).getByText('Aluno Demo')).toBeInTheDocument()
  })

  it('removes the student after a successful unlink, with a single DELETE', async () => {
    vi.mocked(http.delete).mockImplementation(async () => {
      serverRoster = []
      return { data: unlinkResponse }
    })
    renderPage()
    const roster = await openUnitRoster()

    await userEvent.click(
      within(roster).getByRole('button', { name: 'Desvincular' }),
    )

    expect(
      await screen.findByText('Nenhum aluno vinculado'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Desvincular' }),
    ).not.toBeInTheDocument()
    expect(http.delete).toHaveBeenCalledTimes(1)
    expect(http.delete).toHaveBeenCalledWith(UNLINK_URL)
    expect(getCalls(ROSTER_URL)).toHaveLength(2)
    expect(notify.success).toHaveBeenCalledWith(
      'Aluno desvinculado da unidade.',
    )
  })

  it('blocks a second unlink while the first one is in flight', async () => {
    let finishUnlink: () => void = () => {}
    vi.mocked(http.delete).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishUnlink = () => {
            serverRoster = []
            resolve({ data: unlinkResponse })
          }
        }),
    )
    renderPage()
    const roster = await openUnitRoster()
    const unlink = within(roster).getByRole('button', { name: 'Desvincular' })

    await userEvent.click(unlink)
    await waitFor(() => expect(unlink).toBeDisabled())
    await userEvent.click(unlink)

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(http.delete).toHaveBeenCalledTimes(1)

    finishUnlink()
    expect(
      await screen.findByText('Nenhum aluno vinculado'),
    ).toBeInTheDocument()
    expect(http.delete).toHaveBeenCalledTimes(1)
  })

  it('reloads the roster after a 404, so a link already gone cannot be unlinked again', async () => {
    // Another session already unlinked the student; this roster is stale.
    vi.mocked(http.delete).mockImplementation(async () => {
      serverRoster = []
      throw apiError(404, 'Vínculo não encontrado', `/api/v1${UNLINK_URL}`)
    })
    renderPage()
    const roster = await openUnitRoster()

    await userEvent.click(
      within(roster).getByRole('button', { name: 'Desvincular' }),
    )

    await waitFor(() =>
      expect(notify.error).toHaveBeenCalledWith('Vínculo não encontrado'),
    )
    expect(
      await screen.findByText('Nenhum aluno vinculado'),
    ).toBeInTheDocument()
    expect(http.delete).toHaveBeenCalledTimes(1)
  })

  it('reloads the student list of the cave, whose units column changed', async () => {
    vi.mocked(http.delete).mockImplementation(async () => {
      serverRoster = []
      return { data: unlinkResponse }
    })
    renderPage()
    expect(await screen.findByText('Aluno Demo')).toBeInTheDocument()
    expect(getCalls('/practitioners')).toHaveLength(1)

    const roster = await openUnitRoster()
    await userEvent.click(
      within(roster).getByRole('button', { name: 'Desvincular' }),
    )
    await screen.findByText('Nenhum aluno vinculado')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Unidade' }),
      '',
    )

    await waitFor(() => expect(getCalls('/practitioners')).toHaveLength(2))
  })
})
