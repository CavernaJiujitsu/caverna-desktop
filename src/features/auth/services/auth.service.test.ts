import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { authService } from '@/features/auth/services/auth.service'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

vi.mock('@/shared/lib/axios', () => ({ http: { post: vi.fn() } }))

const mockedPost = vi.mocked(http.post)

const userId = '550e8400-e29b-41d4-a716-446655440000'
const practitionerId = '660e8400-e29b-41d4-a716-446655440001'

describe('authService', () => {
  beforeEach(() => {
    mockedPost.mockReset()
  })

  it('sends credentials and unwraps the backend response envelope', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        message: 'Login realizado com sucesso',
        data: {
          accessToken: 'access-token-123',
          tokenType: 'Bearer',
          expiresIn: 7200,
          userId,
          practitionerId,
        },
        timestamp: '2026-11-07T12:00:00.000Z',
      },
    })

    const response = await authService.login('pessoa@exemplo.com', 'senha123')

    expect(mockedPost).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'pessoa@exemplo.com',
      password: 'senha123',
    })
    expect(response).toEqual({
      accessToken: 'access-token-123',
      tokenType: 'Bearer',
      expiresIn: 7200,
      userId,
      practitionerId,
    })
  })

  it('rejects a response that does not match the confirmed contract', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { accessToken: 'access-token-123' },
    })

    await expect(
      authService.login('pessoa@exemplo.com', 'senha123'),
    ).rejects.toBeInstanceOf(AppError)
  })

  it('accepts an authorized account without a practitioner profile', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'teacher-token',
          tokenType: 'Bearer',
          expiresIn: 7200,
          userId,
        },
      },
    })
    const response = await authService.login(
      'professor@exemplo.com',
      'senha123',
    )
    expect(response.userId).toBe(userId)
    expect(response).not.toHaveProperty('practitionerId')
  })

  it('maps rate limiting to a dedicated error kind', async () => {
    mockedPost.mockRejectedValueOnce(
      new AxiosError(
        'Too Many Requests',
        undefined,
        {} as InternalAxiosRequestConfig,
        undefined,
        {
          data: null,
          status: 429,
          statusText: 'Too Many Requests',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
          request: null,
        } as AxiosResponse,
      ),
    )

    await expect(
      authService.login('pessoa@exemplo.com', 'senha123'),
    ).rejects.toMatchObject({ kind: 'rate-limited', status: 429 })
  })
})
