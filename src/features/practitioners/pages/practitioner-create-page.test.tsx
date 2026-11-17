import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import PractitionerCreatePage from '@/features/practitioners/pages/practitioner-create-page'
import { useSession } from '@/shared/session/session'
import { SessionProvider } from '@/shared/session/session-context'
import type { ManagementContext } from '@/shared/types/management-context'

const mocks = vi.hoisted(() => ({
  useCreatePractitioner: vi.fn(),
}))

vi.mock('@/features/practitioners/hooks/use-practitioners', () => ({
  useCreatePractitioner: mocks.useCreatePractitioner,
}))

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
    <MemoryRouter initialEntries={['/practitioners/create']}>
      <SessionProvider>
        <SessionBootstrap context={context} />
        <PractitionerCreatePage />
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
  mocks.useCreatePractitioner.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({
      id: 'practitioner-1',
      user: { name: 'Aluno Teste', email: 'aluno@example.com' },
    }),
    isPending: false,
  })
})

it('exibe o form de cadastro com conta e coordenadas opcionais', () => {
  renderPage(caveAdminContext)

  expect(
    screen.getByRole('heading', { level: 1, name: 'Cadastrar aluno' }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Nome completo')).toBeInTheDocument()
  expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
  expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
  expect(screen.getByLabelText('Longitude')).toBeInTheDocument()
  expect(screen.queryByLabelText('Logradouro')).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Cadastrar aluno' }),
  ).toBeInTheDocument()
})

it('cadastra o aluno com dados obrigatórios preenchidos', async () => {
  renderPage(caveAdminContext)

  await userEvent.type(screen.getByLabelText('Nome completo'), 'Aluno Teste')
  await userEvent.type(screen.getByLabelText('E-mail'), 'aluno@caverna.com')
  await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
  await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha1234')

  await userEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

  await waitFor(() =>
    expect(mocks.useCreatePractitioner().mutateAsync).toHaveBeenCalledWith({
      name: 'Aluno Teste',
      email: 'aluno@caverna.com',
      password: 'senha1234',
    }),
  )
})

it('exibe erro de validação quando os dados obrigatórios não são preenchidos', async () => {
  renderPage(caveAdminContext)

  await userEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

  await waitFor(() =>
    expect(screen.getByText('Informe o nome do aluno.')).toBeInTheDocument(),
  )
  expect(mocks.useCreatePractitioner().mutateAsync).not.toHaveBeenCalled()
})
