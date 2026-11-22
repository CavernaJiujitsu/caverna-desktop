import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import PlatformCavesPage from './platform-caves-page'

const mocks = vi.hoisted(() => ({
  usePlatformCaves: vi.fn(),
}))

vi.mock('@/features/platform/hooks/use-platform-caves', () => ({
  usePlatformCaves: mocks.usePlatformCaves,
  useArchivePlatformCave: () => ({ mutateAsync: vi.fn() }),
  useUpdatePlatformCave: () => ({ mutateAsync: vi.fn() }),
}))
vi.mock('@/shared/session/session', () => ({
  useSession: () => ({ selectedContext: { role: 'platform' } }),
}))
vi.mock('@/features/management/components/management-shell', () => ({
  ManagementShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

const data = [
  { id: '1', name: 'Caverna São Paulo', active: true, units: [{ id: 'u1' }] },
  { id: '2', name: 'Tatame Santana', active: false, units: [] },
  { id: '3', name: 'Caverna Campinas', active: true, units: [{ id: 'u2' }] },
]

beforeEach(() => {
  mocks.usePlatformCaves.mockReturnValue({
    data,
    isPending: false,
    isError: false,
  })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <PlatformCavesPage />
    </MemoryRouter>,
  )
}

it('filters every loaded academy by name, case and accents without changing totals', async () => {
  renderPage()
  const user = userEvent.setup()
  const table = screen.getByRole('table')

  expect(within(table).getAllByRole('row')).toHaveLength(4)
  await user.type(
    screen.getByRole('searchbox', { name: 'Pesquisar academia' }),
    '  SAO PAULO  ',
  )
  expect(within(table).getAllByRole('row')).toHaveLength(2)
  expect(within(table).getByText('Caverna São Paulo')).toBeInTheDocument()
  expect(screen.getByText('1 de 3 academias')).toBeInTheDocument()
  expect(
    within(screen.getByText('Academias ativas').closest('article')!).getByText(
      '2',
    ),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Limpar pesquisa' }))
  expect(within(table).getAllByRole('row')).toHaveLength(4)
})

it('explains when a search matches nothing without claiming the network is empty', async () => {
  renderPage()
  await userEvent
    .setup()
    .type(
      screen.getByRole('searchbox', { name: 'Pesquisar academia' }),
      'inexistente',
    )
  expect(
    screen.getByText('Nenhuma academia corresponde à pesquisa'),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('Nenhuma caverna encontrada'),
  ).not.toBeInTheDocument()
  expect(screen.getByText('0 de 3 academias')).toBeInTheDocument()
})
