import { beforeEach, expect, it, vi } from 'vitest'
import { addressLookup } from './address-lookup'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/shared/lib/axios', () => ({
  http: { get: mocks.get },
  normalizeHttpError: (error: unknown) => error,
}))

beforeEach(() => mocks.get.mockReset())

it('searches through the backend without exposing a provider key', async () => {
  const result = { address: 'Rua A', latitude: -23.5, longitude: -46.6 }
  mocks.get.mockResolvedValueOnce({ data: { data: [result] } })
  await expect(addressLookup.search('Rua A')).resolves.toEqual([result])
  expect(mocks.get).toHaveBeenCalledWith('/practitioners/addresses/search', {
    params: { q: 'Rua A' },
  })
})

it('reverse-geocodes through the backend and handles no result', async () => {
  mocks.get.mockResolvedValueOnce({ data: { data: null } })
  await expect(addressLookup.reverse(-23.5, -46.6)).resolves.toBeNull()
  expect(mocks.get).toHaveBeenCalledWith('/practitioners/addresses/reverse', {
    params: { latitude: -23.5, longitude: -46.6 },
  })
})
