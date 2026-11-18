import { useEffect } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addDays,
  endOfDayIso,
  toDateInputValue,
} from '@/features/classes/services/class-dates'
import TrainingsPage from '@/features/trainings/pages/trainings-page'
import type { TrainingQuery } from '@/features/trainings/services/training.service'
import { useSession } from '@/shared/session/session'
import { SessionProvider } from '@/shared/session/session-context'
import type { ManagementContext } from '@/shared/types/management-context'

const mocks = vi.hoisted(() => ({
  useTrainings: vi.fn(),
  useEnrollments: vi.fn(),
  usePlatformCaves: vi.fn(),
  useAllManagedCaveUnits: vi.fn(),
}))

vi.mock('@/features/trainings/hooks/use-trainings', () => ({
  useTrainings: mocks.useTrainings,
}))
vi.mock('@/features/classes/hooks/use-classes', () => ({
  useEnrollments: mocks.useEnrollments,
}))
vi.mock('@/features/platform/hooks/use-platform-caves', () => ({
  usePlatformCaves: mocks.usePlatformCaves,
}))
vi.mock('@/features/academies/hooks/use-academies', () => ({
  useAllManagedCaveUnits: mocks.useAllManagedCaveUnits,
}))

const platformContext: ManagementContext = {
  id: 'platform:root',
  role: 'platform',
  label: 'Administração da plataforma',
  detail: 'Todas as cavernas',
}

const academyContext: ManagementContext = {
  id: 'academy:9157d890-613d-43b8-960a-b090a7af17e2',
  role: 'academy',
  label: 'Caverna Matriz',
  detail: 'Todas as unidades',
  caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
}

function SessionBootstrap({ context }: { context: ManagementContext }) {
  const { setSelectedContext, setSession } = useSession()
  useEffect(() => {
    setSession({
      user: { id: 'u-1', email: 'root@caverna.com', name: 'Root' },
      accessToken: 'jwt',
      expiresAt: Date.now() + 60_000,
      roles: context.role === 'platform' ? ['ADMIN', 'ROOT'] : ['CAVE_ADMIN'],
    })
    setSelectedContext(context)
  }, [context, setSelectedContext, setSession])
  return null
}

function renderPage(context: ManagementContext = platformContext) {
  return render(
    <MemoryRouter initialEntries={['/trainings']}>
      <SessionProvider>
        <SessionBootstrap context={context} />
        <TrainingsPage />
      </SessionProvider>
    </MemoryRouter>,
  )
}

/** Arguments of the latest `useTrainings` call: query and `enabled`. */
function lastTrainingsCall() {
  const call = mocks.useTrainings.mock.lastCall as [TrainingQuery, boolean]
  return { query: call[0], enabled: call[1] }
}

const training = {
  id: 'class-1',
  type: 'SCHEDULED' as const,
  startsAt: '2026-11-18T22:00:00.000Z',
  endsAt: '2026-11-18T23:30:00.000Z',
  capacity: 30,
  caveName: 'Caverna Matriz',
  caveUnitName: 'Unidade Centro',
  teacherName: 'Mestre Semente',
  enrolledCount: 12,
  presentCount: 8,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.usePlatformCaves.mockReturnValue({
    isSuccess: true,
    data: [{ id: 'cave-1', name: 'Caverna Matriz' }],
  })
  mocks.useAllManagedCaveUnits.mockReturnValue({ isSuccess: false })
  mocks.useTrainings.mockReturnValue({
    isPending: false,
    isError: false,
    data: { items: [training], page: 1, totalPages: 1, total: 1 },
    refetch: vi.fn(),
  })
  mocks.useEnrollments.mockReturnValue({
    isPending: false,
    isError: false,
    data: [
      {
        id: 'e-1',
        status: 'CONFIRMED',
        studentName: 'Ana',
        studentEmail: 'ana@caverna.com',
      },
      {
        id: 'e-2',
        status: 'PENDING',
        studentName: 'Bruno',
        studentEmail: null,
      },
    ],
    refetch: vi.fn(),
  })
})

it('lists trainings with seat usage and expands the roster', async () => {
  renderPage(academyContext)

  expect(await screen.findByText('12/30 alunos')).toBeInTheDocument()
  expect(screen.getByText('8 presentes')).toBeInTheDocument()
  expect(screen.getByText('Mestre Semente')).toBeInTheDocument()
  expect(screen.queryByText('Ana')).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { expanded: false }))

  expect(screen.getByText('Ana')).toBeInTheDocument()
  expect(screen.getByText('Presente')).toBeInTheDocument()
  expect(screen.getByText('Inscrito')).toBeInTheDocument()
  expect(mocks.useEnrollments).toHaveBeenCalledWith('class-1')
  expect(screen.getByRole('link', { name: 'Gerenciar aula' })).toHaveAttribute(
    'href',
    '/classes?classId=class-1',
  )
})

it('hides "Gerenciar aula" from the platform context, which cannot open classes', async () => {
  renderPage(platformContext)

  await userEvent.click(await screen.findByRole('button', { expanded: false }))

  expect(screen.getByText('Ana')).toBeInTheDocument()
  expect(
    screen.queryByRole('link', { name: 'Gerenciar aula' }),
  ).not.toBeInTheDocument()
})

it('shows a fallback when the API does not send the teacher name', async () => {
  mocks.useTrainings.mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      items: [{ ...training, teacherName: null }],
      page: 1,
      totalPages: 1,
      total: 1,
    },
    refetch: vi.fn(),
  })
  renderPage()

  expect(await screen.findByText('Professor não informado')).toBeInTheDocument()
})

it('shows the loading state while trainings load', async () => {
  mocks.useTrainings.mockReturnValue({
    isPending: true,
    isError: false,
    data: undefined,
    refetch: vi.fn(),
  })
  renderPage()

  expect(await screen.findByRole('status')).toHaveTextContent(
    'Carregando treinos…',
  )
})

it('shows a retryable error when trainings fail to load', async () => {
  const refetch = vi.fn()
  mocks.useTrainings.mockReturnValue({
    isPending: false,
    isError: true,
    error: new Error('boom'),
    data: undefined,
    refetch,
  })
  renderPage()

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Não foi possível carregar os treinos.')
  expect(
    screen.queryByText('Nenhum treino neste período'),
  ).not.toBeInTheDocument()
  await userEvent.click(
    within(alert).getByRole('button', { name: 'Tentar novamente' }),
  )
  expect(refetch).toHaveBeenCalled()
})

it('shows the empty state when the period has no trainings', async () => {
  mocks.useTrainings.mockReturnValue({
    isPending: false,
    isError: false,
    data: { items: [], page: 1, totalPages: 0, total: 0 },
    refetch: vi.fn(),
  })
  renderPage()

  expect(
    await screen.findByText('Nenhum treino neste período'),
  ).toBeInTheDocument()
})

describe('period filter (FRD §7)', () => {
  it('limits a period longer than 31 days and warns, instead of blocking', async () => {
    renderPage()
    const today = new Date()
    const limitedEnd = toDateInputValue(addDays(today, 31))

    fireEvent.change(await screen.findByLabelText('Até'), {
      target: { value: toDateInputValue(addDays(today, 40)) },
    })

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('O período máximo é de 31 dias.')
    expect(notice).toHaveTextContent(
      new Intl.DateTimeFormat('pt-BR').format(addDays(today, 31)),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const { query, enabled } = lastTrainingsCall()
    expect(enabled).toBe(true)
    expect(query.to).toBe(endOfDayIso(limitedEnd))
    expect(screen.getByText('12/30 alunos')).toBeInTheDocument()
  })

  it('blocks the filter when the start is after the end', async () => {
    renderPage()
    const today = new Date()

    fireEvent.change(await screen.findByLabelText('Até'), {
      target: { value: toDateInputValue(addDays(today, -1)) },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'A data inicial deve ser anterior à final.',
    )
    expect(lastTrainingsCall().enabled).toBe(false)
    expect(screen.queryByText('12/30 alunos')).not.toBeInTheDocument()
  })
})
