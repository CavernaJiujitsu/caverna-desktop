import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleForm } from '@/features/schedules/components/schedule-form'
import type { ClassSchedule } from '@/features/schedules/schemas/schedule.schema'

const mutationMocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  deactivate: vi.fn(),
  units: [
    { id: '660e8400-e29b-41d4-a716-446655440001', name: 'Unidade Centro' },
  ],
}))

const availableUnits = [
  { id: '660e8400-e29b-41d4-a716-446655440001', name: 'Unidade Centro' },
]

vi.mock('@/features/schedules/hooks/use-schedules', () => ({
  useScheduleMutations: () => ({
    create: { isPending: false, mutateAsync: mutationMocks.create },
    update: { isPending: false, mutateAsync: mutationMocks.update },
    deactivate: { isPending: false, mutateAsync: mutationMocks.deactivate },
  }),
}))

vi.mock('@/features/management/hooks/use-scope-units', () => ({
  useScopeUnits: () => ({
    units: mutationMocks.units,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/teachers/hooks/use-teachers', () => ({
  useTeacherOptions: () => ({
    data: [
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        name: 'Rafael Souza',
        email: 'rafael@caverna.app',
      },
    ],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/shared/session/session', () => ({
  useSession: () => ({
    selectedContext: {
      id: 'academy:880e8400-e29b-41d4-a716-446655440003',
      role: 'academy',
      caveId: '880e8400-e29b-41d4-a716-446655440003',
      label: 'Caverna Matriz',
      detail: 'Todas as unidades',
    },
  }),
}))

const schedule: ClassSchedule = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  caveUnitId: '660e8400-e29b-41d4-a716-446655440001',
  teacherId: '770e8400-e29b-41d4-a716-446655440002',
  title: 'Treino de Segunda',
  startsAt: '1970-01-01T19:00:00.000Z',
  endsAt: '1970-01-01T20:30:00.000Z',
  dayOfWeek: 1,
  startDate: '2026-10-05',
  endDate: '2027-02-15',
  capacity: 30,
  active: true,
}

describe('ScheduleForm', () => {
  beforeEach(() => {
    mutationMocks.create.mockReset()
    mutationMocks.update.mockReset()
    mutationMocks.deactivate.mockReset()
    mutationMocks.units = [...availableUnits]
    mutationMocks.update.mockResolvedValue({
      scope: 'all',
      updated: 2,
      schedules: [schedule],
    })
  })

  it('updates the whole series when scope "all" is selected', async () => {
    render(
      <ScheduleForm schedule={schedule} onDone={vi.fn()} onCancel={vi.fn()} />,
    )

    expect(
      screen.getByText(/altera apenas o registro aberto/),
    ).toBeInTheDocument()

    const allScope = screen.getByRole('radio', {
      name: 'Todos os horários da série',
    })
    await userEvent.click(allScope)
    expect(allScope).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar horário' }))

    await waitFor(() => {
      expect(mutationMocks.update).toHaveBeenCalledWith({
        id: schedule.id,
        input: expect.objectContaining({ scope: 'all' }),
      })
    })
  })

  it('shows the series teacher from teacher.user (contract C1) when editing', () => {
    render(
      <ScheduleForm
        schedule={{
          ...schedule,
          teacher: {
            id: schedule.teacherId,
            user: { name: 'Juliana Gracie' },
          },
        }}
      />,
    )

    expect(screen.getByText('Juliana Gracie')).toBeInTheDocument()
  })

  it('shows a fallback teacher label when the API omits teacher.user', () => {
    render(
      <ScheduleForm
        schedule={{ ...schedule, teacher: { id: schedule.teacherId } }}
      />,
    )

    expect(screen.getByText('Professor não informado')).toBeInTheDocument()
  })

  it('creates a schedule with unit and teacher selected by name', async () => {
    mutationMocks.create.mockResolvedValue(schedule)

    render(<ScheduleForm onDone={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Treino de Terça' },
    })
    fireEvent.change(screen.getByLabelText('Unidade'), {
      target: { value: schedule.caveUnitId },
    })
    fireEvent.change(screen.getByLabelText('Professor'), {
      target: { value: schedule.teacherId },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Criar horário' }))

    await waitFor(() => {
      expect(mutationMocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          caveUnitId: schedule.caveUnitId,
          teacherId: schedule.teacherId,
          title: 'Treino de Terça',
        }),
      )
    })
  })

  it('requires a unit before creating a schedule', async () => {
    mutationMocks.create.mockResolvedValue(schedule)

    render(<ScheduleForm />)

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Treino de Quarta' },
    })
    fireEvent.change(screen.getByLabelText('Professor'), {
      target: { value: schedule.teacherId },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar horário' }))

    await waitFor(() => {
      expect(screen.getByText('Informe um UUID válido.')).toBeInTheDocument()
    })
    expect(mutationMocks.create).not.toHaveBeenCalled()
  })

  it('explains that a unit is required when none exist', async () => {
    mutationMocks.units = []

    render(<ScheduleForm />)

    expect(
      screen.getByText('Cadastre uma unidade antes de criar o horário.'),
    ).toBeInTheDocument()
  })
})
