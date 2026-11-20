import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import PlatformCaveCreatePage from './platform-cave-create-page'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  search: vi.fn(),
  reverse: vi.fn(),
}))
vi.mock('@/features/platform/hooks/use-platform-caves', () => ({
  useCreatePlatformCave: () => ({
    mutateAsync: mocks.create,
    isPending: false,
  }),
}))
vi.mock('@/features/management/components/management-shell', () => ({
  ManagementShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/shared/lib/address-lookup', () => ({
  addressLookup: { search: mocks.search, reverse: mocks.reverse },
}))
vi.mock('@/shared/lib/notifications', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.create.mockResolvedValue({})
})

it('requires an address and coordinates for each initial unit and keeps multiple units independent', async () => {
  render(
    <MemoryRouter>
      <PlatformCaveCreatePage />
    </MemoryRouter>,
  )
  const user = userEvent.setup()
  await user.type(
    screen.getAllByRole('textbox', { name: 'Nome' })[0]!,
    'Caverna Nova',
  )
  await user.click(screen.getByRole('button', { name: 'Adicionar unidade' }))
  const addressInputs = screen.getAllByRole('textbox', { name: 'Endereço' })
  expect(addressInputs).toHaveLength(2)
  const names = screen.getAllByRole('textbox', { name: 'Nome' })
  await user.type(names[1]!, 'Unidade A')
  await user.type(names[2]!, 'Unidade B')
  await user.type(addressInputs[0]!, 'Rua A')
  await user.type(addressInputs[1]!, 'Rua B')
  const latitudes = screen.getAllByRole('spinbutton', { name: /latitude/ })
  const longitudes = screen.getAllByRole('spinbutton', { name: /longitude/ })
  await user.type(latitudes[0]!, '-23.5')
  await user.type(longitudes[0]!, '-46.6')
  await user.type(latitudes[1]!, '-23.6')
  await user.type(longitudes[1]!, '-46.7')
  await user.click(screen.getByRole('button', { name: 'Criar caverna' }))
  await waitFor(() =>
    expect(mocks.create).toHaveBeenCalledWith({
      name: 'Caverna Nova',
      units: [
        {
          name: 'Unidade A',
          address: 'Rua A',
          latitude: -23.5,
          longitude: -46.6,
          neighborhood: undefined,
        },
        {
          name: 'Unidade B',
          address: 'Rua B',
          latitude: -23.6,
          longitude: -46.7,
          neighborhood: undefined,
        },
      ],
    }),
  )
}, 15000)
