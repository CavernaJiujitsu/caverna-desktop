import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeacherCreateForm } from '@/features/teachers/components/teacher-forms'
import type { ManagementContext } from '@/shared/types/management-context'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  useScopeUnits: vi.fn(),
  context: null as ManagementContext | null,
}))

vi.mock('@/features/teachers/hooks/use-teachers', () => ({
  useTeacherMutations: () => ({
    create: { isPending: false, mutateAsync: mocks.create },
  }),
}))

vi.mock(
  '@/features/management/hooks/use-scope-units',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/features/management/hooks/use-scope-units')
    >()),
    useScopeUnits: mocks.useScopeUnits,
  }),
)

vi.mock('@/shared/session/session', () => ({
  useSession: () => ({ selectedContext: mocks.context }),
}))

const caveId = '22222222-2222-4222-8222-222222222222'
const unitId = '33333333-3333-4333-8333-333333333333'
const units = [
  { id: unitId, name: 'Centro', caveId, caveName: 'Caverna Matriz' },
]

async function fillAccount() {
  await userEvent.type(screen.getByLabelText('Nome'), 'Rafael Souza')
  await userEvent.type(screen.getByLabelText('E-mail'), 'rafael@caverna.app')
  await userEvent.type(screen.getByLabelText('Senha inicial'), 'senha-forte')
}

describe('TeacherCreateForm', () => {
  beforeEach(() => {
    mocks.create.mockReset().mockResolvedValue(undefined)
    mocks.useScopeUnits.mockReturnValue({
      units,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
  })

  it('requires at least one unit for a cave admin', async () => {
    mocks.context = {
      id: `academy:${caveId}`,
      role: 'academy',
      label: 'Caverna Matriz',
      detail: '',
      caveId,
    }
    render(<TeacherCreateForm />)
    await fillAccount()

    await userEvent.click(
      screen.getByRole('button', { name: 'Criar professor' }),
    )
    expect(
      await screen.findByText('Selecione ao menos uma unidade da caverna.'),
    ).toBeInTheDocument()
    expect(mocks.create).not.toHaveBeenCalled()

    await userEvent.click(screen.getByLabelText('Centro'))
    await userEvent.click(
      screen.getByRole('button', { name: 'Criar professor' }),
    )
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        name: 'Rafael Souza',
        email: 'rafael@caverna.app',
        password: 'senha-forte',
        caveUnitIds: [unitId],
      }),
    )
  })

  it('creates a platform teacher without units', async () => {
    mocks.context = {
      id: 'platform:me',
      role: 'platform',
      label: 'Plataforma',
      detail: '',
    }
    render(<TeacherCreateForm />)
    await fillAccount()

    await userEvent.click(
      screen.getByRole('button', { name: 'Criar professor' }),
    )

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({ caveUnitIds: [] }),
      ),
    )
  })
})
