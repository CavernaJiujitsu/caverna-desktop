import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeacherCreateForm } from '@/features/teachers/components/teacher-forms'

const formMocks = vi.hoisted(() => ({
  create: vi.fn(),
  units: [
    { id: '33333333-3333-4333-8333-333333333333', name: 'Unidade Centro' },
    { id: '44444444-4444-4444-8444-444444444444', name: 'Unidade Norte' },
  ],
}))

const availableUnits = [
  { id: '33333333-3333-4333-8333-333333333333', name: 'Unidade Centro' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Unidade Norte' },
]

vi.mock('@/features/academies', () => ({
  useCaveUnits: () => ({
    data: formMocks.units,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/teachers/hooks/use-teachers', () => ({
  useTeacherMutations: () => ({
    create: { isPending: false, mutateAsync: formMocks.create },
  }),
}))

vi.mock('@/shared/session/session', () => ({
  useSession: () => ({
    selectedContext: {
      id: 'academy:22222222-2222-4222-8222-222222222222',
      role: 'academy',
      caveId: '22222222-2222-4222-8222-222222222222',
      label: 'Caverna Matriz',
      detail: 'Todas as unidades',
    },
  }),
}))

describe('TeacherCreateForm', () => {
  beforeEach(() => {
    formMocks.create.mockReset()
    formMocks.create.mockResolvedValue(undefined)
    formMocks.units = [...availableUnits]
  })

  async function fillRequiredFields() {
    await userEvent.type(screen.getByLabelText('Nome'), 'Rafael Souza')
    await userEvent.type(screen.getByLabelText('E-mail'), 'rafael@caverna.app')
    await userEvent.type(screen.getByLabelText('Senha inicial'), 'senha-segura')
  }

  it('creates a cave-scoped teacher without sending unit ids by default', async () => {
    render(<TeacherCreateForm />)
    await fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Criar professor' }))

    await waitFor(() => {
      expect(formMocks.create).toHaveBeenCalledWith({
        name: 'Rafael Souza',
        email: 'rafael@caverna.app',
        password: 'senha-segura',
      })
    })
  })

  it('sends selected unit ids with the cave name', async () => {
    render(<TeacherCreateForm />)
    await fillRequiredFields()
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Adicionar a unidade' }),
    )
    await userEvent.click(screen.getByText(/Selecionar unidades/))
    await userEvent.click(screen.getByLabelText('Unidade Centro'))
    await userEvent.click(screen.getByLabelText('Unidade Norte'))

    fireEvent.click(screen.getByRole('button', { name: 'Criar professor' }))

    await waitFor(() => {
      expect(formMocks.create).toHaveBeenCalledWith({
        name: 'Rafael Souza',
        email: 'rafael@caverna.app',
        password: 'senha-segura',
        caveUnitIds: [
          {
            caveUnitId: '33333333-3333-4333-8333-333333333333',
            caveName: 'Caverna Matriz',
          },
          {
            caveUnitId: '44444444-4444-4444-8444-444444444444',
            caveName: 'Caverna Matriz',
          },
        ],
      })
    })
  })

  it('requires a selection when adding a teacher to specific units', async () => {
    render(<TeacherCreateForm />)
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Adicionar a unidade' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Criar professor' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Selecione ao menos uma unidade.',
    )
    expect(formMocks.create).not.toHaveBeenCalled()
  })

  it('allows cave-scoped creation when the cave has no units', async () => {
    formMocks.units = []
    render(<TeacherCreateForm />)

    expect(
      screen.getByText('Esta caverna ainda não tem unidades cadastradas.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: 'Adicionar a unidade' }),
    ).toBeDisabled()
    await fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: 'Criar professor' }))

    await waitFor(() => {
      expect(formMocks.create).toHaveBeenCalledWith({
        name: 'Rafael Souza',
        email: 'rafael@caverna.app',
        password: 'senha-segura',
      })
    })
  })
})
