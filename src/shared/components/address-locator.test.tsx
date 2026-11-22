import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { AddressLocator, type AddressLocation } from './address-locator'

const mocks = vi.hoisted(() => ({ search: vi.fn(), reverse: vi.fn() }))
vi.mock('@/shared/lib/address-lookup', () => ({
  addressLookup: { search: mocks.search, reverse: mocks.reverse },
}))

function Form() {
  const [value, setValue] = useState<AddressLocation>({ address: '' })
  return (
    <>
      <AddressLocator id="test" value={value} onChange={setValue} />
      <output data-testid="location">{JSON.stringify(value)}</output>
    </>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: undefined,
  })
})

it('only fills coordinates after an explicit choice, and invalidates them when the chosen address changes', async () => {
  mocks.search.mockResolvedValue([
    { address: 'Rua A, 10', latitude: -23.55, longitude: -46.63 },
    { address: 'Rua A, 20', latitude: -23.56, longitude: -46.64 },
  ])
  render(<Form />)
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: 'Endereço' }), 'Rua A')
  await user.click(screen.getByRole('button', { name: 'Buscar endereço' }))
  expect(
    await screen.findByRole('button', { name: 'Rua A, 10' }),
  ).toBeInTheDocument()
  expect(screen.getByTestId('location')).not.toHaveTextContent('latitude')
  await user.click(screen.getByRole('button', { name: 'Rua A, 20' }))
  expect(screen.getByTestId('location')).toHaveTextContent('"latitude":-23.56')
  await user.type(screen.getByRole('textbox', { name: 'Endereço' }), ' extra')
  expect(screen.getByTestId('location')).not.toHaveTextContent('latitude')
})

it('keeps device coordinates but asks for a manual address if reverse lookup fails', async () => {
  mocks.reverse.mockRejectedValue(new Error('offline'))
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (success: PositionCallback) =>
        success({
          coords: { latitude: -23.5, longitude: -46.6 },
        } as GeolocationPosition),
    },
  })
  render(<Form />)
  const user = userEvent.setup()
  await user.click(
    screen.getByRole('button', { name: 'Usar localização atual' }),
  )
  await waitFor(() =>
    expect(
      screen.getByText(/Busca indisponível\. Escreva o endereço/),
    ).toBeInTheDocument(),
  )
  await user.type(
    screen.getByRole('textbox', { name: 'Endereço' }),
    'Rua Manual',
  )
  expect(screen.getByTestId('location')).toHaveTextContent('"latitude":-23.5')
  expect(screen.getByTestId('location')).toHaveTextContent('Rua Manual')
})

it('does not replace a selected address when device permission is denied', async () => {
  mocks.search.mockResolvedValue([
    { address: 'Rua Escolhida', latitude: -23.5, longitude: -46.6 },
  ])
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (
        _success: PositionCallback,
        error: PositionErrorCallback,
      ) => error({ code: 1 } as GeolocationPositionError),
    },
  })
  render(<Form />)
  const user = userEvent.setup()
  await user.type(
    screen.getByRole('textbox', { name: 'Endereço' }),
    'Rua Escolhida',
  )
  await user.click(screen.getByRole('button', { name: 'Buscar endereço' }))
  await user.click(await screen.findByRole('button', { name: 'Rua Escolhida' }))
  await user.click(
    screen.getByRole('button', { name: 'Usar localização atual' }),
  )
  expect(screen.getByTestId('location')).toHaveTextContent('Rua Escolhida')
  expect(screen.getByTestId('location')).toHaveTextContent('"latitude":-23.5')
})
