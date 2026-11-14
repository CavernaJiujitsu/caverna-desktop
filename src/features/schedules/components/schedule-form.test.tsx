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

vi.mock('@/features/academies', () => ({
  useCaveUnits: () => ({
    data: mutationMocks.units,
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

  it('omits the unit id to create a schedule for the cave scope', async () => {
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
      expect(mutationMocks.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ caveUnitId: expect.anything() }),
      )
    })
  })

  it('creates a cave-scoped schedule when no units exist', async () => {
    mutationMocks.units = []
    mutationMocks.create.mockResolvedValue(schedule)

    render(<ScheduleForm />)

    expect(
      screen.getByText(
        'Sem unidades cadastradas; o horário será aplicado à caverna.',
      ),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Treino de Quinta' },
    })
    fireEvent.change(screen.getByLabelText('Professor'), {
      target: { value: schedule.teacherId },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar horário' }))

    await waitFor(() => {
      expect(mutationMocks.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ caveUnitId: expect.anything() }),
      )
    })
  })
})
