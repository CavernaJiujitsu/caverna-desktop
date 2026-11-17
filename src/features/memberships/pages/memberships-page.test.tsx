import { useEffect } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MembershipsPage from '@/features/memberships/pages/memberships-page'
import { useSession } from '@/shared/session/session'
import { SessionProvider } from '@/shared/session/session-context'
import type { ManagementContext } from '@/shared/types/management-context'

const mocks = vi.hoisted(() => ({
  useAllManagedCaveUnits: vi.fn(),
  usePlatformCaves: vi.fn(),
  useStudentMemberships: vi.fn(),
  useStudentMembershipMutations: vi.fn(),
  usePractitionerSearch: vi.fn(),
  usePractitionerList: vi.fn(),
}))

vi.mock('@/features/academies/hooks/use-academies', () => ({
  useAllManagedCaveUnits: mocks.useAllManagedCaveUnits,
}))

vi.mock('@/features/platform/hooks/use-platform-caves', () => ({
  usePlatformCaves: mocks.usePlatformCaves,
}))

vi.mock('@/features/practitioners/hooks/use-practitioners', () => ({
  usePractitionerSearch: mocks.usePractitionerSearch,
  usePractitionerList: mocks.usePractitionerList,
}))

vi.mock('@/features/memberships/hooks/use-memberships', () => ({
  useStudentMemberships: mocks.useStudentMemberships,
  useStudentMembershipMutations: mocks.useStudentMembershipMutations,
}))

const activeUnit = {
  id: 'unit-active',
  name: 'Unidade Centro',
  neighborhood: 'Centro',
  active: true,
}
const archivedUnit = {
  id: 'unit-archived',
  name: 'Unidade Arquivada',
  neighborhood: 'Norte',
  active: false,
}

// One item of GET /memberships/students/cave-units/:id/practitioners, copied
// from the local API (17/11).
const rosterMembership = {
  id: 'c1bd028d-e338-4507-9d63-fc9141754841',
  createdAt: '2026-11-17T03:36:50.830Z',
  updatedAt: '2026-11-17T03:36:50.830Z',
  createdBy: null,
  active: true,
  joinedAt: '2026-11-17T03:36:50.829Z',
  practitioner: {
    id: '03ab11c3-5b0e-4d8e-b60d-1cf7887144b0',
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

function SessionBootstrap({ context }: { context: ManagementContext }) {
  const { setSelectedContext, setSession } = useSession()
  useEffect(() => {
    setSession({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin',
      },
      accessToken: 'jwt-token',
      expiresAt: Date.now() + 60_000,
      roles: context.role === 'platform' ? ['ADMIN'] : ['CAVE_ADMIN'],
    })
    setSelectedContext(context)
  }, [context, setSelectedContext, setSession])
  return null
}

function renderPage(context: ManagementContext) {
  return render(
    <MemoryRouter initialEntries={['/memberships']}>
      <SessionProvider>
        <SessionBootstrap context={context} />
        <MembershipsPage />
      </SessionProvider>
    </MemoryRouter>,
  )
}

const caveAdminContext: ManagementContext = {
  id: 'academy:cave-confirmed',
  role: 'academy',
  label: 'Minha caverna',
  detail: 'Gestão da caverna',
  caveId: 'cave-confirmed',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.usePlatformCaves.mockReturnValue({
    isPending: false,
    isSuccess: true,
    isError: false,
    data: [{ id: 'cave-platform', name: 'Caverna Global' }],
    refetch: vi.fn(),
  })
  mocks.useAllManagedCaveUnits.mockReturnValue({
    isPending: false,
    isSuccess: true,
    isError: false,
    data: [activeUnit, archivedUnit],
    refetch: vi.fn(),
  })
  mocks.useStudentMemberships.mockReturnValue({
    isPending: false,
    isError: false,
    data: [],
    refetch: vi.fn(),
  })
  mocks.useStudentMembershipMutations.mockReturnValue({
    link: { isPending: false, mutateAsync: vi.fn() },
    unlink: { isPending: false, mutateAsync: vi.fn() },
  })
  mocks.usePractitionerList.mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      items: [
        {
          id: 'practitioner-9',
          user: { id: 'user-9', name: 'Aluno Geral', email: 'geral@caverna.com' },
          currentBelt: { id: 'belt-blue', name: 'Azul' },
          units: [
            {
              id: 'unit-active',
              name: 'Unidade Centro',
              caveId: 'cave-confirmed',
              caveName: 'Minha caverna',
            },
          ],
        },
        {
          id: 'practitioner-10',
          user: { id: 'user-10', name: 'Aluno Solto', email: 'solto@caverna.com' },
          currentBelt: null,
          units: [],
        },
      ],
      page: 1,
      totalPages: 1,
      total: 2,
    },
    refetch: vi.fn(),
  })
  mocks.usePractitionerSearch.mockReturnValue({
    isPending: false,
    isError: false,
    data: [
      {
        id: 'practitioner-1',
        user: { id: 'user-2', name: 'Aluna Demo', email: 'aluna@caverna.com' },
      },
    ],
  })
})

it('links a student found by name instead of a typed UUID', async () => {
  const link = vi.fn().mockResolvedValue(undefined)
  mocks.useStudentMembershipMutations.mockReturnValue({
    link: { isPending: false, mutateAsync: link },
    unlink: { isPending: false, mutateAsync: vi.fn() },
  })
  renderPage(caveAdminContext)

  await userEvent.selectOptions(
    await screen.findByRole('combobox', { name: 'Unidade' }),
    'unit-active',
  )
  await userEvent.type(
    screen.getByLabelText('Buscar aluno por nome ou e-mail'),
    'Aluna',
  )
  await userEvent.click(await screen.findByRole('button', { name: 'Vincular' }))

  await waitFor(() =>
    expect(link).toHaveBeenCalledWith({
      practitionerId: 'practitioner-1',
      caveUnitId: 'unit-active',
    }),
  )
})

it('lists active units in a dropdown and loads students when one is selected', async () => {
  renderPage(caveAdminContext)

  await waitFor(() =>
    expect(mocks.useAllManagedCaveUnits).toHaveBeenLastCalledWith(
      'cave-confirmed',
    ),
  )
  expect(screen.queryByText('UUID da unidade')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Consultar alunos' }),
  ).not.toBeInTheDocument()

  const selector = screen.getByRole('combobox', { name: 'Unidade' })
  expect(
    screen.getByRole('option', { name: 'Unidade Centro · Centro' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('option', { name: /Unidade Arquivada/ }),
  ).not.toBeInTheDocument()

  await userEvent.selectOptions(selector, 'unit-active')

  await waitFor(() =>
    expect(screen.getAllByText('Unidade Centro · Centro')).toHaveLength(2),
  )
  expect(screen.getByText('Nenhum aluno vinculado')).toBeInTheDocument()
  expect(mocks.useStudentMemberships).toHaveBeenLastCalledWith('unit-active')
})

it('uses only caves returned to the global administrator', async () => {
  renderPage({
    id: 'platform:global',
    role: 'platform',
    label: 'Administração global',
    detail: '',
  })

  // No cave filter at first: every student of the network is listed.
  expect(await screen.findByText('Aluno Geral')).toBeInTheDocument()
  expect(mocks.usePractitionerList).toHaveBeenLastCalledWith({
    page: 1,
    search: undefined,
    caveId: undefined,
  })
  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Caverna' }),
    'cave-platform',
  )
  expect(mocks.useAllManagedCaveUnits).toHaveBeenLastCalledWith('cave-platform')
  await waitFor(() =>
    expect(mocks.usePractitionerList).toHaveBeenLastCalledWith({
      page: 1,
      search: undefined,
      caveId: 'cave-platform',
    }),
  )
})

it('lists every student of the scope with belt and units when no unit is chosen', async () => {
  renderPage(caveAdminContext)

  expect(await screen.findByText('Aluno Geral')).toBeInTheDocument()
  expect(screen.getByText('Azul')).toBeInTheDocument()
  expect(screen.getByText('Unidade Centro')).toBeInTheDocument()
  expect(screen.getByText('Sem faixa')).toBeInTheDocument()
  expect(screen.getByText('Sem unidade')).toBeInTheDocument()
  expect(mocks.usePractitionerList).toHaveBeenLastCalledWith({
    page: 1,
    search: undefined,
    caveId: 'cave-confirmed',
  })

  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Unidade' }),
    'unit-active',
  )
  expect(screen.queryByText('Aluno Geral')).not.toBeInTheDocument()
  expect(mocks.useStudentMemberships).toHaveBeenLastCalledWith('unit-active')
})

it('shows loading and API errors for the available unit list', async () => {
  mocks.useAllManagedCaveUnits.mockReturnValue({
    isPending: true,
    isSuccess: false,
    isError: false,
    data: undefined,
    refetch: vi.fn(),
  })
  const page = renderPage(caveAdminContext)
  expect(await screen.findByText('Carregando unidades…')).toBeInTheDocument()

  mocks.useAllManagedCaveUnits.mockReturnValue({
    isPending: false,
    isSuccess: false,
    isError: true,
    error: new Error('api error'),
    data: undefined,
    refetch: vi.fn(),
  })
  page.rerender(
    <MemoryRouter initialEntries={['/memberships']}>
      <SessionProvider>
        <SessionBootstrap context={caveAdminContext} />
        <MembershipsPage />
      </SessionProvider>
    </MemoryRouter>,
  )

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível carregar as unidades.',
  )
})

describe('"Validar faixa" shortcut', () => {
  beforeEach(() => {
    mocks.useStudentMemberships.mockReturnValue({
      isPending: false,
      isError: false,
      data: [rosterMembership],
      refetch: vi.fn(),
    })
  })

  it('links to the evaluations page in a cave admin context', async () => {
    renderPage(caveAdminContext)

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Unidade' }),
      'unit-active',
    )

    const roster = screen.getByRole('list', { name: 'Alunos da unidade' })
    expect(within(roster).getByText('Aluno Demo')).toBeInTheDocument()
    expect(
      within(roster).getByRole('link', { name: 'Validar faixa' }),
    ).toHaveAttribute('href', '/evaluations')
  })

  it('is hidden in the platform context, which cannot open the evaluations page', async () => {
    renderPage({
      id: 'platform:global',
      role: 'platform',
      label: 'Administração global',
      detail: '',
    })

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Caverna' }),
      'cave-platform',
    )
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Unidade' }),
      'unit-active',
    )

    const roster = screen.getByRole('list', { name: 'Alunos da unidade' })
    expect(within(roster).getByText('Aluno Demo')).toBeInTheDocument()
    expect(
      within(roster).getByRole('button', { name: 'Desvincular' }),
    ).toBeInTheDocument()
    expect(
      within(roster).queryByRole('link', { name: 'Validar faixa' }),
    ).not.toBeInTheDocument()
  })
})
