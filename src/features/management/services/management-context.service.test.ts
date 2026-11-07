import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildLocalFallbackContext,
  managementContextService,
} from '@/features/management/services/management-context.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), post: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedGet = vi.mocked(http.get)
const mockedPost = vi.mocked(http.post)

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
          {
            id: 'ctx-1',
            role: 'academy',
            label: 'Academia A',
            detail: 'todas as unidades',
          },
          {
            id: 'ctx-2',
            role: 'teacher',
            label: 'Professor B',
            detail: 'unidade ilustrativa',
          },
        ],
        timestamp: '2026-11-07T12:00:00.000Z',
      },
    })

    const contexts = await managementContextService.list()

    expect(mockedGet).toHaveBeenCalledWith('/api/v1/management/contexts')
    expect(contexts).toHaveLength(2)
    expect(contexts[0]).toEqual({
      id: 'ctx-1',
      role: 'academy',
      label: 'Academia A',
      detail: 'todas as unidades',
    })
  })

  it('switches context by posting the selected context id', async () => {
    mockedPost.mockResolvedValueOnce({})
    await managementContextService.switch('ctx-1')
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/v1/management/contexts/switch',
      {
        contextId: 'ctx-1',
      },
    )
  })

  it('builds a local fallback context for the authenticated user', () => {
    expect(buildLocalFallbackContext('user-1')).toEqual({
      id: 'local:user-1',
      role: 'academy',
      label: 'Gestão da academia',
      detail: 'Contexto local até a API de contextos ser disponibilizada.',
    })
  })
})
