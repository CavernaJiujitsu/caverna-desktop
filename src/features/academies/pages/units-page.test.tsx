import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import UnitsPage from '@/features/academies/pages/units-page'
import { useSession } from '@/shared/session/session'
import { SessionProvider } from '@/shared/session/session-context'
import type { ManagementContext } from '@/shared/types/management-context'

const mocks = vi.hoisted(() => ({
  useAcademies: vi.fn(),
  useCaveUnitPage: vi.fn(),
  useUnitManagementMutations: vi.fn(),
  archive: vi.fn(),
  reactivate: vi.fn(),
}))

vi.mock('@/features/academies/hooks/use-academies', () => ({
  useAcademies: mocks.useAcademies,
  useCaveUnitPage: mocks.useCaveUnitPage,
  useUnitManagementMutations: mocks.useUnitManagementMutations,
}))

const activeUnit = {
  id: 'unit-active',
  name: 'Unidade Ativa',
  address: 'Rua A',
  neighborhood: 'Centro',
  latitude: -23.5,
  longitude: -46.6,
  active: true,
}
const archivedUnit = {
  id: 'unit-archived',
  name: 'Unidade Arquivada',
  address: 'Rua B',
  neighborhood: 'Norte',
  latitude: -23.6,
  longitude: -46.7,
  active: false,
}
const pageData = {
  items: [activeUnit, archivedUnit],
  page: 1,
  totalPage: 2,
  total: 21,
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

function renderPage(context: ManagementContext, initialEntry = '/units') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SessionProvider>
        <SessionBootstrap context={context} />
        <UnitsPage />
      </SessionProvider>
    </MemoryRouter>,
  )
}

function setDefaultQueries() {
  mocks.useAcademies.mockReturnValue({
    isPending: false,
    isSuccess: true,
    isError: false,
    data: [{ id: 'cave-platform', name: 'Caverna Platform', units: [] }],
    refetch: vi.fn(),
  })
  mocks.useCaveUnitPage.mockReturnValue({
    isPending: false,
    isError: false,
    data: pageData,
    refetch: vi.fn(),
  })
  mocks.useUnitManagementMutations.mockReturnValue({
    create: { isPending: false, mutateAsync: vi.fn() },
    update: { isPending: false, mutateAsync: vi.fn() },
    archive: { isPending: false, mutateAsync: mocks.archive },
    reactivate: { isPending: false, mutateAsync: mocks.reactivate },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  vi.clearAllMocks()
  setDefaultQueries()
})
afterEach(() => vi.restoreAllMocks())

const caveAdminContext: ManagementContext = {
  id: 'academy:cave-confirmed',
  role: 'academy',
  label: 'Minha caverna',
  detail: 'Gestão da caverna',
  caveId: 'cave-confirmed',
}

it('uses only the cave from the confirmed CAVE_ADMIN context', async () => {
  renderPage(caveAdminContext, '/units?caveId=cave-arbitrary')

  await waitFor(() =>
    expect(mocks.useCaveUnitPage).toHaveBeenLastCalledWith(
      'cave-confirmed',
      expect.objectContaining({ page: 1, limit: 20 }),
    ),
  )
  expect(
    mocks.useCaveUnitPage.mock.calls.some(
      ([caveId]) => caveId === 'cave-arbitrary',
    ),
  ).toBe(false)
})

it('lets ADMIN choose only a cave returned by the authorized cave list', async () => {
  renderPage(
    {
      id: 'platform:global',
      role: 'platform',
      label: 'Administração global',
      detail: '',
    },
    '/units?caveId=not-authorized',
  )

  await waitFor(() =>
    expect(mocks.useCaveUnitPage).toHaveBeenLastCalledWith(
      'cave-platform',
      expect.objectContaining({ page: 1 }),
    ),
  )
  expect(
    mocks.useCaveUnitPage.mock.calls.some(
      ([caveId]) => caveId === 'not-authorized',
    ),
  ).toBe(false)
})

it('shows active and archived units and offers reactivation', async () => {
  mocks.reactivate.mockResolvedValue({})
  renderPage(caveAdminContext)

  expect(await screen.findByText('Unidade Ativa')).toBeInTheDocument()
  expect(screen.getByRole('table', { name: 'Unidades da caverna' })).toBeInTheDocument()
  expect(screen.getByText('Unidade Arquivada')).toBeInTheDocument()
  expect(screen.getByText('Ativa')).toBeInTheDocument()
  expect(screen.getByText('Arquivada')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Reativar' }))

  await waitFor(() =>
    expect(mocks.reactivate).toHaveBeenCalledWith('unit-archived'),
  )
})

it('asks for confirmation before archiving and reports success only after the API', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  mocks.archive.mockResolvedValue({})
  renderPage(caveAdminContext)

  await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }))

  expect(confirm).toHaveBeenCalledWith(
    'Arquivar "Unidade Ativa"? A unidade, seus vínculos e histórico serão preservados.',
  )
  await waitFor(() => expect(mocks.archive).toHaveBeenCalledWith('unit-active'))
})

it('applies backend search and pagination', async () => {
  renderPage(caveAdminContext)
  await userEvent.type(
    screen.getByPlaceholderText('Buscar por nome, endereço ou bairro'),
    'bairro',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

  await waitFor(() =>
    expect(mocks.useCaveUnitPage).toHaveBeenLastCalledWith('cave-confirmed', {
      page: 1,
      limit: 20,
      search: 'bairro',
    }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  await waitFor(() =>
    expect(mocks.useCaveUnitPage).toHaveBeenLastCalledWith('cave-confirmed', {
      page: 2,
      limit: 20,
      search: 'bairro',
    }),
  )
})

it('renders loading, empty and API error states', async () => {
  mocks.useCaveUnitPage.mockReturnValue({
    isPending: true,
    isError: false,
    data: undefined,
    refetch: vi.fn(),
  })
  const page = renderPage(caveAdminContext)
  expect(await screen.findByText('Carregando unidades…')).toBeInTheDocument()

  mocks.useCaveUnitPage.mockReturnValue({
    isPending: false,
    isError: false,
    data: { items: [], page: 1, totalPage: 0, total: 0 },
    refetch: vi.fn(),
  })
  page.rerender(
    <MemoryRouter initialEntries={['/units']}>
      <SessionProvider>
        <SessionBootstrap context={caveAdminContext} />
        <UnitsPage />
      </SessionProvider>
    </MemoryRouter>,
  )
  expect(
    await screen.findByText('Nenhuma unidade cadastrada'),
  ).toBeInTheDocument()

  mocks.useCaveUnitPage.mockReturnValue({
    isPending: false,
    isError: true,
    error: new Error('api error'),
    data: undefined,
    refetch: vi.fn(),
  })
  page.rerender(
    <MemoryRouter initialEntries={['/units']}>
      <SessionProvider>
        <SessionBootstrap context={caveAdminContext} />
        <UnitsPage />
      </SessionProvider>
    </MemoryRouter>,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível carregar as unidades.',
  )
})
