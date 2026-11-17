import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import SchedulesPage from '@/features/schedules/pages/schedules-page'
import type { ClassSchedule } from '@/features/schedules/schemas/schedule.schema'

const mocks = vi.hoisted(() => ({ useSchedules: vi.fn() }))

vi.mock('@/features/management/components/management-shell', () => ({
  ManagementShell: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

// The form has its own tests; the page only places it.
vi.mock('@/features/schedules/components/schedule-form', () => ({
  ScheduleForm: () => null,
}))

vi.mock('@/features/schedules/hooks/use-schedules', () => ({
  useSchedules: mocks.useSchedules,
  useSchedule: () => ({ isPending: true }),
  useScheduleMutations: () => ({
    deactivate: { isPending: false, mutateAsync: vi.fn() },
  }),
}))

const base: ClassSchedule = {
  id: '5b1f0a3e-6f6c-4d55-9a57-2f4e8d1c0b11',
  caveUnitId: '7ad902c2-4988-47fc-8340-e7bc2dc3b477',
  teacherId: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
  title: 'Treino de Segunda',
  startsAt: '2026-11-16T22:00:00.000Z',
  endsAt: '2026-11-16T23:30:00.000Z',
  dayOfWeek: 1,
  startDate: '2026-11-16',
  endDate: '2027-05-16',
  capacity: 30,
  active: true,
  caveUnit: { id: '7ad902c2-4988-47fc-8340-e7bc2dc3b477', name: 'Consolação' },
}

function listResult(data: ClassSchedule[]) {
  return { isPending: false, isError: false, data, refetch: vi.fn() }
}

beforeEach(() => vi.clearAllMocks())

it('shows the teacher name from C1 and a fallback when it is missing', () => {
  mocks.useSchedules.mockReturnValue(
    listResult([
      {
        ...base,
        teacher: { id: base.teacherId, user: { name: 'Juliana Gracie' } },
      },
      {
        ...base,
        id: '6c2f0a3e-6f6c-4d55-9a57-2f4e8d1c0b12',
        title: 'Treino de Terça',
        dayOfWeek: 2,
        teacher: { id: base.teacherId },
      },
    ]),
  )
  render(<SchedulesPage />)

  const items = within(
    screen.getByRole('list', { name: 'Horários recorrentes' }),
  ).getAllByRole('listitem')
  expect(items[0]).toHaveTextContent('Juliana Gracie')
  expect(items[1]).toHaveTextContent('Professor não informado')
})

it('shows the loading state', () => {
  mocks.useSchedules.mockReturnValue({ isPending: true, isError: false })
  render(<SchedulesPage />)

  expect(screen.getByRole('status')).toHaveTextContent('Carregando horários…')
})

it('shows a retryable error instead of an empty list', async () => {
  const refetch = vi.fn()
  mocks.useSchedules.mockReturnValue({
    isPending: false,
    isError: true,
    error: new Error('boom'),
    refetch,
  })
  render(<SchedulesPage />)

  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent('Não foi possível carregar os horários.')
  expect(
    screen.queryByText('Nenhum horário cadastrado'),
  ).not.toBeInTheDocument()
  await userEvent.click(
    within(alert).getByRole('button', { name: 'Tentar novamente' }),
  )
  expect(refetch).toHaveBeenCalled()
})

it('shows the empty state when there are no schedules', () => {
  mocks.useSchedules.mockReturnValue(listResult([]))
  render(<SchedulesPage />)

  expect(screen.getByText('Nenhum horário cadastrado')).toBeInTheDocument()
})
