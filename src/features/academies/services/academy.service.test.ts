import { describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import { academyService } from './academy.service'

vi.mock('@/shared/lib/axios', () => ({ http: { get: vi.fn(), post: vi.fn() } }))

describe('academyService', () => {
  it('consulta cavernas pelo endpoint real', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: { data: { data: [{ id: 'c1', name: 'Caverna' }] } } })
    await expect(academyService.list()).resolves.toEqual([{ id: 'c1', name: 'Caverna' }])
    expect(http.get).toHaveBeenCalledWith('/caves', expect.any(Object))
  })
})
