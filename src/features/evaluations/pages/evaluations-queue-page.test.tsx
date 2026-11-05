import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import EvaluationsQueuePage from '@/features/evaluations/pages/evaluations-queue-page'
import { SessionProvider } from '@/shared/session/session-context'

vi.mock('@/features/evaluations/hooks/use-evaluations', () => ({
  useEvaluations: () => ({
    isLoading: false,
    isError: false,
    data: [{
      id: 'evaluation-1',
      status: 'SCHEDULED',
      scheduledAt: '2026-11-05T22:00:00.000Z',
      teacher: { id: 'teacher-1', user: { name: 'Rafael Souza' } },
      practitioner: { user: { name: 'Marina Costa' } },
      targetBelt: { name: 'Branca' },
      class: { startsAt: '2026-11-05T22:00:00.000Z', caveUnit: { name: 'Vila Mariana' } },
    }],
    refetch: vi.fn(),
  }),
  useApproveEvaluation: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('@/features/teachers/hooks/use-teachers', () => ({
  useTeachers: () => ({ isLoading: false, isError: false, data: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Rafael Souza' }] }),
}))

it('renders evaluations returned by the queue query', () => {
  render(<MemoryRouter><SessionProvider><QueryClientProvider client={new QueryClient()}><EvaluationsQueuePage /></QueryClientProvider></SessionProvider></MemoryRouter>)
  expect(screen.getByText('Marina Costa')).toBeInTheDocument()
  expect(screen.getByText('Rafael Souza')).toBeInTheDocument()
})
