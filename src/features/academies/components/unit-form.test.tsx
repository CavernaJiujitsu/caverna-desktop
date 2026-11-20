import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { UnitForm } from '@/features/academies/components/unit-form'
import { AppError } from '@/shared/types/app-error'
import { notify } from '@/shared/lib/notifications'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  search: vi.fn(),
  reverse: vi.fn(),
}))
vi.mock('@/shared/lib/address-lookup', () => ({
  addressLookup: { search: mocks.search, reverse: mocks.reverse },
}))

vi.mock('@/features/academies/hooks/use-academies', () => ({
  useUnitManagementMutations: () => ({
    create: { isPending: false, mutateAsync: mocks.create },
    update: { isPending: false, mutateAsync: mocks.update },
    archive: { isPending: false, mutateAsync: vi.fn() },
    reactivate: { isPending: false, mutateAsync: vi.fn() },
  }),
}))

vi.mock('@/shared/lib/notifications', () => ({
  notify: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

beforeEach(() => vi.clearAllMocks())

it('validates required fields and coordinate ranges before creating', async () => {
  render(<UnitForm caveId="cave-1" />)
  await userEvent.click(screen.getByRole('button', { name: 'Criar unidade' }))

  expect(await screen.findByText('Informe o nome.')).toBeInTheDocument()
  expect(screen.getByText('Informe a latitude.')).toBeInTheDocument()
  expect(screen.getByText('Informe a longitude.')).toBeInTheDocument()
  expect(mocks.create).not.toHaveBeenCalled()

  await userEvent.type(
    screen.getByRole('textbox', { name: /Nome/ }),
    'Unidade Inválida',
  )
  await userEvent.type(
    screen.getByRole('spinbutton', { name: /unit latitude/ }),
    '91',
  )
  await userEvent.type(
    screen.getByRole('spinbutton', { name: /unit longitude/ }),
    '-46',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Criar unidade' }))

  expect(await screen.findByText('O valor máximo é 90.')).toBeInTheDocument()
  expect(mocks.create).not.toHaveBeenCalled()
})

it('uses browser GPS coordinates and submits numeric values', async () => {
  const getCurrentPosition = vi.fn((success: PositionCallback) => {
    success({
      coords: { latitude: -23.55, longitude: -46.63 },
    } as GeolocationPosition)
  })
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  })
  mocks.create.mockResolvedValue({})
  mocks.reverse.mockResolvedValue({
    address: 'Rua GPS, São Paulo',
    latitude: -23.55,
    longitude: -46.63,
  })

  render(<UnitForm caveId="cave-1" />)
  await userEvent.type(
    screen.getByRole('textbox', { name: /Nome/ }),
    'Unidade GPS',
  )
  await userEvent.click(
    screen.getByRole('button', { name: 'Usar localização atual' }),
  )
  await userEvent.click(
    await screen.findByRole('button', { name: 'Rua GPS, São Paulo' }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Criar unidade' }))

  await waitFor(() =>
    expect(mocks.create).toHaveBeenCalledWith({
      name: 'Unidade GPS',
      address: 'Rua GPS, São Paulo',
      latitude: -23.55,
      longitude: -46.63,
    }),
  )
  expect(notify.success).toHaveBeenCalledWith('Unidade criada.')
})

it('explains unavailable GPS and keeps manual coordinates usable', async () => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: undefined,
  })
  render(<UnitForm caveId="cave-1" />)

  await userEvent.click(
    screen.getByRole('button', { name: 'Usar localização atual' }),
  )

  expect(screen.getByRole('status')).toHaveTextContent(
    'Localização indisponível. Informe endereço e coordenadas manualmente.',
  )
  expect(
    screen.getByRole('spinbutton', { name: /unit latitude/ }),
  ).toBeEnabled()
  expect(
    screen.getByRole('spinbutton', { name: /unit longitude/ }),
  ).toBeEnabled()
})

it('sends only modified fields when editing', async () => {
  mocks.update.mockResolvedValue({})
  render(
    <UnitForm
      caveId="cave-1"
      unit={{
        id: 'unit-1',
        name: 'Unidade Antiga',
        address: 'Rua A',
        neighborhood: 'Centro',
        latitude: '-23.5',
        longitude: '-46.6',
        active: true,
      }}
    />,
  )

  const nameInput = screen.getByRole('textbox', { name: /Nome/ })
  await userEvent.clear(nameInput)
  await userEvent.type(nameInput, 'Unidade Nova')
  await userEvent.click(
    screen.getByRole('button', { name: 'Salvar alterações' }),
  )

  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith({
      unitId: 'unit-1',
      input: { name: 'Unidade Nova' },
    }),
  )
})

it('surfaces API errors without reporting a successful save', async () => {
  mocks.create.mockRejectedValue(
    new AppError('forbidden', 'Sem permissão.', 403),
  )
  render(<UnitForm caveId="cave-1" />)

  await userEvent.type(screen.getByRole('textbox', { name: /Nome/ }), 'Unidade')
  await userEvent.type(
    screen.getByRole('textbox', { name: 'Endereço' }),
    'Rua Manual',
  )
  await userEvent.type(
    screen.getByRole('spinbutton', { name: /unit latitude/ }),
    '-23',
  )
  await userEvent.type(
    screen.getByRole('spinbutton', { name: /unit longitude/ }),
    '-46',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Criar unidade' }))

  await waitFor(() =>
    expect(notify.error).toHaveBeenCalledWith('Sem permissão.'),
  )
  expect(notify.success).not.toHaveBeenCalled()
})
