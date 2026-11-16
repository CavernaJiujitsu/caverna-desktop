import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TeacherCreateForm } from '@/features/teachers/components/teacher-forms'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
  },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

const formMocks = vi.hoisted(() => ({
  create: vi.fn(),
}))

const caveUnitsMock = vi.hoisted(() => ({
  useCaveUnits: vi.fn(),
}))

vi.mock('@/features/teachers/hooks/use-teachers', () => ({
  useTeacherMutations: () => ({
    create: { isPending: false, mutateAsync: formMocks.create },
    linkExisting: { isPending: false, mutateAsync: vi.fn() },
  }),
}))

vi.mock('@/features/academies', () => ({
  useCaveUnits: caveUnitsMock.useCaveUnits,
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

const unitId = '33333333-3333-4333-8333-333333333333'

describe('TeacherCreateForm', () => {
  beforeEach(() => {
    formMocks.create.mockReset()
    formMocks.create.mockResolvedValue(undefined)
    caveUnitsMock.useCaveUnits.mockReturnValue({
      data: [{ id: unitId, name: 'Caverna Matriz', active: true }],
      isPending: false,
      isError: false,
    } as never)
  })

  async function fillRequiredFields() {
    await userEvent.type(screen.getByLabelText('Nome'), 'Rafael Souza')
    await userEvent.type(screen.getByLabelText('E-mail'), 'rafael@caverna.app')
    await userEvent.type(screen.getByLabelText('Senha inicial'), 'senha-segura')
    await userEvent.selectOptions(screen.getByLabelText('Unidade'), unitId)
  }

  it('creates a teacher sending name, email, password and cave unit ids', async () => {
    renderWithProviders(
      <TeacherCreateForm caveId="22222222-2222-4222-8222-222222222222" />,
    )
    await fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Criar professor' }))

    await waitFor(() => {
      expect(formMocks.create).toHaveBeenCalledWith({
        name: 'Rafael Souza',
        email: 'rafael@caverna.app',
        password: 'senha-segura',
        caveUnitIds: [{ caveUnitId: unitId, caveName: 'Caverna Matriz' }],
      })
    })
  })

  it('shows validation errors when required fields are empty', async () => {
    renderWithProviders(
      <TeacherCreateForm caveId="22222222-2222-4222-8222-222222222222" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Criar professor' }))

    expect(await screen.findByText('Informe o nome.')).toBeInTheDocument()
    expect(
      await screen.findByText('Informe um e-mail válido.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Informe uma senha inicial.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Selecione uma unidade válida.'),
    ).toBeInTheDocument()
    expect(formMocks.create).not.toHaveBeenCalled()
  })

  it('does not expose the existing-teacher tab nor the add-unit option', async () => {
    renderWithProviders(
      <TeacherCreateForm caveId="22222222-2222-4222-8222-222222222222" />,
    )

    expect(
      screen.queryByRole('tab', { name: 'Professor existente' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Adicionar a unidade' }),
    ).not.toBeInTheDocument()
  })
})
