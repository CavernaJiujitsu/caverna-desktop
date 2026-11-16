import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import MembershipsPage from '@/features/memberships/pages/memberships-page'
import { useSession } from '@/shared/session/session'
import { SessionProvider } from '@/shared/session/session-context'
import type { ManagementContext } from '@/shared/types/management-context'

const mocks = vi.hoisted(() => ({
  useAllManagedCaveUnits: vi.fn(),
  usePlatformCaves: vi.fn(),
  useStudentMemberships: vi.fn(),
  useStudentMembershipMutations: vi.fn(),
}))

vi.mock('@/features/academies/hooks/use-academies', () => ({
  useAllManagedCaveUnits: mocks.useAllManagedCaveUnits,
}))

vi.mock('@/features/platform/hooks/use-platform-caves', () => ({
  usePlatformCaves: mocks.usePlatformCaves,
}))

vi.mock('@/features/memberships/hooks/use-memberships', () => ({
  useStudentMemberships: mocks.useStudentMemberships,
  useStudentMembershipMutations: mocks.useStudentMembershipMutations,
}))

const activeUnit = {
  id: 'unit-active',
  name: 'Unidade Centro',
  neighborhood: 'Centro',
  active: true,
}
const archivedUnit = {
  id: 'unit-archived',
  name: 'Unidade Arquivada',
  neighborhood: 'Norte',
  active: false,
}

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
    <MemoryRouter initialEntries={['/memberships']}>
      <SessionProvider>
        <SessionBootstrap context={context} />
        <MembershipsPage />
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
  mocks.usePlatformCaves.mockReturnValue({
    isPending: false,
    isSuccess: true,
    isError: false,
    data: [{ id: 'cave-platform', name: 'Caverna Global' }],
    refetch: vi.fn(),
  })
  mocks.useAllManagedCaveUnits.mockReturnValue({
    isPending: false,
    isSuccess: true,
    isError: false,
    data: [activeUnit, archivedUnit],
    refetch: vi.fn(),
  })
  mocks.useStudentMemberships.mockReturnValue({
    isPending: false,
    isError: false,
    data: [],
    refetch: vi.fn(),
  })
  mocks.useStudentMembershipMutations.mockReturnValue({
    link: { isPending: false, mutateAsync: vi.fn() },
    unlink: { isPending: false, mutateAsync: vi.fn() },
  })
})

it('lists active units in a dropdown and loads students when one is selected', async () => {
  renderPage(caveAdminContext)

  await waitFor(() =>
    expect(mocks.useAllManagedCaveUnits).toHaveBeenLastCalledWith(
      'cave-confirmed',
    ),
  )
  expect(screen.queryByText('UUID da unidade')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Consultar alunos' }),
  ).not.toBeInTheDocument()

  const selector = screen.getByRole('combobox', { name: 'Unidade' })
  expect(
    screen.getByRole('option', { name: 'Unidade Centro · Centro' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('option', { name: /Unidade Arquivada/ }),
  ).not.toBeInTheDocument()

  await userEvent.selectOptions(selector, 'unit-active')

  await waitFor(() =>
    expect(screen.getAllByText('Unidade Centro · Centro')).toHaveLength(2),
  )
  expect(screen.getByText('Nenhum aluno vinculado')).toBeInTheDocument()
  expect(mocks.useStudentMemberships).toHaveBeenLastCalledWith('unit-active')
})

it('uses only caves returned to the global administrator', async () => {
  renderPage({
    id: 'platform:global',
    role: 'platform',
    label: 'Administração global',
    detail: '',
  })

  await waitFor(() =>
    expect(mocks.useAllManagedCaveUnits).toHaveBeenLastCalledWith(
      'cave-platform',
    ),
  )
  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Caverna' }),
    'cave-platform',
  )
  expect(mocks.useAllManagedCaveUnits).toHaveBeenLastCalledWith('cave-platform')
})

it('shows loading and API errors for the available unit list', async () => {
  mocks.useAllManagedCaveUnits.mockReturnValue({
    isPending: true,
    isSuccess: false,
    isError: false,
    data: undefined,
    refetch: vi.fn(),
  })
  const page = renderPage(caveAdminContext)
  expect(await screen.findByText('Carregando unidades…')).toBeInTheDocument()

  mocks.useAllManagedCaveUnits.mockReturnValue({
    isPending: false,
    isSuccess: false,
    isError: true,
    error: new Error('api error'),
    data: undefined,
    refetch: vi.fn(),
  })
  page.rerender(
    <MemoryRouter initialEntries={['/memberships']}>
      <SessionProvider>
        <SessionBootstrap context={caveAdminContext} />
        <MembershipsPage />
      </SessionProvider>
    </MemoryRouter>,
  )

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível carregar as unidades.',
  )
})
