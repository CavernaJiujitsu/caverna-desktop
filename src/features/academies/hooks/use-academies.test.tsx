import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { academyKeys, useUnitManagementMutations } from './use-academies'

const serviceMocks = vi.hoisted(() => ({
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  removeUnit: vi.fn(),
}))

vi.mock('@/features/academies/services/academy.service', () => ({
  academyService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    listUnits: vi.fn(),
    listUnitsPage: vi.fn(),
    getUnit: vi.fn(),
    createUnit: serviceMocks.createUnit,
    updateUnit: serviceMocks.updateUnit,
    removeUnit: serviceMocks.removeUnit,
  },
}))

function MutationHarness() {
  const mutations = useUnitManagementMutations('cave-1')
  return (
    <button
      type="button"
      onClick={() =>
        void mutations.create.mutateAsync({
          name: 'Unidade Nova',
          latitude: -23.5,
          longitude: -46.6,
        })
      }
    >
      Criar unidade
    </button>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('invalidates cached unit pages after a successful creation', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const params = { page: 1, limit: 20 }
  const queryKey = academyKeys.unitPage('cave-1', params)
  queryClient.setQueryData(queryKey, {
    items: [],
    page: 1,
    totalPage: 0,
    total: 0,
  })
  serviceMocks.createUnit.mockResolvedValue({
    id: 'unit-1',
    name: 'Unidade Nova',
    latitude: -23.5,
    longitude: -46.6,
    active: true,
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MutationHarness />
    </QueryClientProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Criar unidade' }))

  await waitFor(() =>
    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true),
  )
  queryClient.clear()
})
