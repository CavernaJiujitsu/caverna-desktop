import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import CatalogPage from './catalog-page'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  saveBelt: vi.fn(),
  saveStage: vi.fn(),
  saveMovement: vi.fn(),
  link: vi.fn(),
  setMinimum: vi.fn(),
}))

vi.mock('../services/catalog.service', () => ({
  catalogService: mocks,
}))
vi.mock('@/features/management/components/management-shell', () => ({
  ManagementShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.list.mockResolvedValue({
    minimumPracticeClasses: 2,
    belts: [{
      id: 'belt',
      name: 'Branca',
      color: 'WHITE',
      level: 1,
      minimumTrainingMinutes: 60,
      minimumTrainingClasses: 2,
    }],
    movements: [{ id: 'movement', name: 'Rolamento', description: null }],
    trails: [{
      id: 'trail',
      belt: { id: 'belt' },
      stages: [{ id: 'stage', name: 'Fundamentos', position: 1, movements: [] }],
    }],
  })
  mocks.setMinimum.mockResolvedValue(undefined)
  mocks.link.mockResolvedValue(undefined)
})

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })}>
      <CatalogPage />
    </QueryClientProvider>,
  )
}

it('edits the universal practice minimum from the catalog screen', async () => {
  renderPage()
  const user = userEvent.setup()
  const field = await screen.findByRole('spinbutton', {
    name: 'Mínimo universal de aulas por movimento',
  })
  await user.clear(field)
  await user.type(field, '3')
  await user.click(screen.getByRole('button', { name: /^Salvar$/ }))
  expect(mocks.setMinimum).toHaveBeenCalledWith(3)
})

it('links a selected movement to its stage instead of assigning all movements', async () => {
  renderPage()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: '+ Associar movimento' }))
  const dialog = screen.getByRole('dialog', { name: 'Associar movimento a Fundamentos' })
  await user.selectOptions(
    within(dialog).getByRole('combobox', { name: 'Movimento para a etapa' }),
    'movement',
  )
  expect(within(dialog).getByRole('spinbutton', { name: 'Ordem do movimento' })).toHaveValue(1)
  await user.click(within(dialog).getByRole('button', { name: 'Associar movimento' }))
  expect(mocks.link).toHaveBeenCalledWith('stage', {
    movementId: 'movement',
    position: 1,
    required: true,
  })
})

it('searches global movements and opens the edit dialog without filling the page with forms', async () => {
  renderPage()
  const user = userEvent.setup()
  const search = await screen.findByRole('searchbox', { name: 'Buscar movimento' })
  await user.type(search, 'inexistente')
  expect(screen.getByText('Nenhum movimento encontrado.')).toBeInTheDocument()
  await user.clear(search)
  await user.click(screen.getByRole('button', { name: 'Editar movimento Rolamento' }))
  const dialog = screen.getByRole('dialog', { name: 'Editar Rolamento' })
  expect(within(dialog).getByRole('textbox', { name: 'Nome do movimento' })).toHaveValue('Rolamento')
  await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('collapses and expands a belt without losing its catalog details', async () => {
  renderPage()
  const user = userEvent.setup()
  await screen.findByRole('button', { name: 'Recolher faixa Branca' })
  await user.click(screen.getByRole('button', { name: 'Recolher faixa Branca' }))
  expect(screen.queryByRole('button', { name: '+ Associar movimento' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Expandir faixa Branca' }))
  expect(screen.getByRole('button', { name: '+ Associar movimento' })).toBeInTheDocument()
})
