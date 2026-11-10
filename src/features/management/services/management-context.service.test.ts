import { beforeEach, describe, expect, it, vi } from 'vitest'
import { managementContextService } from './management-context.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), post: vi.fn() },
  normalizeHttpError: (error: unknown) => error,
}))
const get = vi.mocked(http.get)
const post = vi.mocked(http.post)
const context = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  role: 'academy',
  label: 'Caverna A',
  detail: 'Gestão',
  caveId: '550e8400-e29b-41d4-a716-446655440002',
}
describe('management context contract', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })
  it('preserves authorized scope and forwards cancellation', async () => {
    get.mockResolvedValueOnce({ data: { data: [context] } })
    const signal = new AbortController().signal
    expect(await managementContextService.list(signal)).toEqual([context])
    expect(get).toHaveBeenCalledWith('/api/v1/management/contexts', { signal })
  })
  it('accepts an empty context list without inventing access', async () => {
    get.mockResolvedValueOnce({ data: { data: [] } })
    expect(await managementContextService.list()).toEqual([])
  })
  it.each([
    { ...context, role: 'unsupported' },
    { ...context, id: 'local:user' },
    { ...context, role: 'teacher' },
  ])('rejects malformed or incomplete contexts', async (invalid) => {
    get.mockResolvedValueOnce({ data: { data: [invalid] } })
    await expect(managementContextService.list()).rejects.toBeDefined()
  })
  it('returns the context revalidated by the server', async () => {
    post.mockResolvedValueOnce({ data: { data: context } })
    expect(await managementContextService.switch(context.id)).toEqual(context)
    expect(post).toHaveBeenCalledWith('/api/v1/management/contexts/switch', {
      contextId: context.id,
    })
  })
  it('rejects a success response for a different context', async () => {
    post.mockResolvedValueOnce({
      data: { data: { ...context, id: context.caveId } },
    })
    await expect(
      managementContextService.switch(context.id),
    ).rejects.toMatchObject({ kind: 'forbidden' })
  })
  it('rejects a success status without a validated context payload', async () => {
    post.mockResolvedValueOnce({ data: {} })
    await expect(
      managementContextService.switch(context.id),
    ).rejects.toBeDefined()
  })
})
