import { describe, it, expect, vi, beforeEach } from 'vitest'
import { managementContextService } from '@/features/management/services/management-context.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), post: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedGet = vi.mocked(http.get)
const mockedPost = vi.mocked(http.post)

const academyContext = {
  id: 'academy:cave-1',
  role: 'academy',
  label: 'Academia A',
  detail: 'Todas as unidades',
}

describe('managementContextService', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
  })

  it('lists contexts from the backend response envelope', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        message: 'OK',
        data: [
          academyContext,
          {
            id: 'teacher:teacher-1',
            role: 'teacher',
            label: 'Professor B',
            detail: 'Unidade Centro',
          },
        ],
        timestamp: '2026-11-07T12:00:00.000Z',
      },
    })

    const contexts = await managementContextService.list()

    expect(mockedGet).toHaveBeenCalledWith('/management/contexts', {
      signal: undefined,
    })
    expect(contexts).toHaveLength(2)
    expect(contexts[0]).toEqual(academyContext)
  })

  it('confirms the switch by posting the selected context id', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { message: 'OK', data: academyContext },
    })

    await expect(
      managementContextService.switch('academy:cave-1'),
    ).resolves.toEqual(academyContext)
    expect(mockedPost).toHaveBeenCalledWith('/management/contexts/switch', {
      contextId: 'academy:cave-1',
    })
  })

  it('rejects a switch response for a different context', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        data: { ...academyContext, id: 'academy:other-cave' },
      },
    })

    await expect(
      managementContextService.switch('academy:cave-1'),
    ).rejects.toMatchObject({ kind: 'forbidden' })
  })
})
