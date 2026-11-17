import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EvaluationsQueuePage from '@/features/evaluations/pages/evaluations-queue-page'
import type { EvaluationFilters } from '@/features/evaluations/services/evaluation.service'

const mocks = vi.hoisted(() => ({
  context: { role: 'academy' as 'academy' | 'teacher' },
  evaluations: [] as unknown[],
  useEvaluations: vi.fn(),
  useValidationClassOptions: vi.fn(),
  refetch: vi.fn(),
}))

vi.mock('@/shared/session/session', () => ({
  useSession: () => ({
    selectedContext: {
      id: `${mocks.context.role}:1`,
      role: mocks.context.role,
      caveId: mocks.context.role === 'academy' ? 'cave-1' : undefined,
      label: 'Contexto',
      detail: '',
    },
    session: { teacherId: 'teacher-1', user: { name: 'Prof' } },
  }),
}))

vi.mock('@/features/management/components/management-shell', () => ({
  ManagementShell: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock('@/features/evaluations/hooks/use-evaluations', () => ({
  useEvaluations: mocks.useEvaluations,
  useEvaluationMutations: () => ({
    schedule: { isPending: false },
    approve: { isPending: false },
    reject: { isPending: false },
    cancel: { isPending: false },
  }),
  useValidationClassOptions: mocks.useValidationClassOptions,
}))

vi.mock('@/features/teachers/hooks/use-teachers', () => ({
  useTeacherOptions: () => ({
    isPending: false,
    isError: false,
    data: [{ id: 'teacher-1', name: 'Rafael Souza' }],
  }),
}))

function queuePage(items: unknown[], page = 1, totalPages = 1, total = 1) {
  return {
    isPending: false,
    isError: false,
    isPlaceholderData: false,
    data: { items, page, totalPages, total },
    refetch: mocks.refetch,
  }
}

/** Filters sent to the API by the latest render. */
function lastFilters(): EvaluationFilters {
  return mocks.useEvaluations.mock.lastCall?.[0] as EvaluationFilters
}

function renderPage() {
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <EvaluationsQueuePage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

const pendingEvaluation = {
  id: 'evaluation-1',
  status: 'PENDING',
  practitioner: { id: 'p1', user: { name: 'Marina Costa' } },
  targetBelt: { id: 'belt-1', name: 'Branca' },
  class: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.context.role = 'academy'
  mocks.useEvaluations.mockImplementation(() =>
    queuePage(mocks.evaluations, 1, 1, mocks.evaluations.length),
  )
  mocks.useValidationClassOptions.mockReturnValue({ isPending: true })
})

it('offers scheduling, rejection and cancellation for a pending request', () => {
  mocks.evaluations = [pendingEvaluation]
  renderPage()

  expect(screen.getByText('Marina Costa')).toBeInTheDocument()
  expect(screen.getByText('Rafael Souza')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Agendar' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Rejeitar' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Aprovar' }),
  ).not.toBeInTheDocument()
})

it('lets the class teacher approve and links to the class attendance', () => {
  mocks.context.role = 'teacher'
  mocks.evaluations = [
    {
      id: 'evaluation-2',
      status: 'SCHEDULED',
      practitioner: { id: 'p1', user: { name: 'Marina Costa' } },
      targetBelt: { id: 'belt-2', name: 'Azul' },
      class: {
        id: 'class-9',
        startsAt: '2026-11-20T22:00:00.000Z',
        caveUnit: { name: 'Centro' },
        teacher: { id: 'teacher-1', user: { name: 'Prof' } },
      },
    },
  ]
  renderPage()

  expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
  expect(
    screen.getByText(/Requer check-in do aluno na aula/),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Abrir chamada' })).toHaveAttribute(
    'href',
    '/classes?classId=class-9',
  )
  expect(
    screen.queryByRole('button', { name: 'Cancelar' }),
  ).not.toBeInTheDocument()
})

it('scopes the classes offered for scheduling by the academy cave', async () => {
  mocks.evaluations = [pendingEvaluation]
  renderPage()

  await userEvent.click(screen.getByRole('button', { name: 'Agendar' }))

  expect(mocks.useValidationClassOptions).toHaveBeenCalledWith(
    { caveId: 'cave-1' },
    true,
  )
})

describe('pagination', () => {
  it('navigates beyond the first 20 validations', async () => {
    mocks.evaluations = [pendingEvaluation]
    mocks.useEvaluations.mockImplementation((filters: EvaluationFilters) =>
      queuePage(mocks.evaluations, filters.page ?? 1, 3, 41),
    )
    renderPage()

    expect(lastFilters()).toMatchObject({
      caveId: 'cave-1',
      status: 'PENDING',
      page: 1,
    })
    expect(screen.getByText('41 validação(ões)')).toBeInTheDocument()
    const pagination = screen.getByRole('navigation', {
      name: 'Paginação de validações',
    })
    expect(within(pagination).getByText('Página 1 de 3')).toBeInTheDocument()

    await userEvent.click(
      within(pagination).getByRole('button', { name: 'Próxima' }),
    )

    expect(lastFilters()).toMatchObject({ page: 2 })
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument()
  })

  it('returns to the first page when a filter changes', async () => {
    mocks.evaluations = [pendingEvaluation]
    mocks.useEvaluations.mockImplementation((filters: EvaluationFilters) =>
      queuePage(mocks.evaluations, filters.page ?? 1, 3, 41),
    )
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(lastFilters()).toMatchObject({ page: 2 })

    await userEvent.selectOptions(screen.getByLabelText('Situação'), 'APPROVED')
    expect(lastFilters()).toMatchObject({ status: 'APPROVED', page: 1 })
  })

  it('goes back to the last page when a decision empties the current one', async () => {
    mocks.evaluations = [pendingEvaluation]
    mocks.useEvaluations.mockImplementation((filters: EvaluationFilters) =>
      filters.page === 2
        ? queuePage([], 2, 1, 20)
        : queuePage(mocks.evaluations, 1, 2, 21),
    )
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(mocks.useEvaluations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
      true,
    )
    expect(lastFilters()).toMatchObject({ page: 1 })
    expect(
      screen.queryByText('Nenhuma validação encontrada'),
    ).not.toBeInTheDocument()
  })

  it('hides the pagination when everything fits in one page', () => {
    mocks.evaluations = [pendingEvaluation]
    renderPage()

    expect(
      screen.queryByRole('navigation', { name: 'Paginação de validações' }),
    ).not.toBeInTheDocument()
  })
})

describe('list states', () => {
  it('shows the loading state', () => {
    mocks.useEvaluations.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Carregando validações…',
    )
  })

  it('shows a retryable error instead of an empty queue', async () => {
    mocks.useEvaluations.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error('boom'),
      data: undefined,
      refetch: mocks.refetch,
    })
    renderPage()

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar a fila.')
    expect(
      screen.queryByText('Nenhuma validação encontrada'),
    ).not.toBeInTheDocument()
    await userEvent.click(
      within(alert).getByRole('button', { name: 'Tentar novamente' }),
    )
    expect(mocks.refetch).toHaveBeenCalled()
  })

  it('shows the empty state when the queue has no validations', () => {
    mocks.evaluations = []
    mocks.useEvaluations.mockReturnValue(queuePage([], 1, 0, 0))
    renderPage()

    expect(
      screen.getByText('Nenhuma validação encontrada'),
    ).toBeInTheDocument()
    expect(screen.getByText('0 validação(ões)')).toBeInTheDocument()
  })
})
