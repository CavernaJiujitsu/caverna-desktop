import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { authService } from '@/features/auth/services/auth.service'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

vi.mock('@/shared/lib/axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/axios')>()
  return { ...actual, http: { post: vi.fn() } }
})

const mockedPost = vi.mocked(http.post)

const userId = '550e8400-e29b-41d4-a716-446655440000'
const teacherId = '660e8400-e29b-41d4-a716-446655440001'
const caveId = '770e8400-e29b-41d4-a716-446655440002'

function axiosErrorWithStatus(status: number, statusText: string) {
  return new AxiosError(
    statusText,
    undefined,
    {} as InternalAxiosRequestConfig,
    undefined,
    {
      data: null,
      status,
      statusText,
      headers: {},
      config: {} as InternalAxiosRequestConfig,
      request: null,
    } as AxiosResponse,
  )
}

describe('authService', () => {
  beforeEach(() => {
    mockedPost.mockReset()
  })

  it('signs in through the desktop login and unwraps the envelope', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        message: 'Login realizado com sucesso',
        data: {
          accessToken: 'access-token-123',
          tokenType: 'Bearer',
          expiresIn: 7200,
          userId,
          roles: ['CAVE_ADMIN', 'TEACHER'],
          teacherId,
          caveId,
        },
        timestamp: '2026-11-07T12:00:00.000Z',
      },
    })

    const response = await authService.login('pessoa@exemplo.com', 'senha123')

    expect(mockedPost).toHaveBeenCalledWith('/desktop/auth/login', {
      email: 'pessoa@exemplo.com',
      password: 'senha123',
    })
    expect(response).toEqual({
      accessToken: 'access-token-123',
      tokenType: 'Bearer',
      expiresIn: 7200,
      userId,
      roles: ['CAVE_ADMIN', 'TEACHER'],
      teacherId,
      caveId,
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

  it('maps invalid credentials to a safe unauthorized error', async () => {
    mockedPost.mockRejectedValueOnce(axiosErrorWithStatus(401, 'Unauthorized'))

    await expect(
      authService.login('pessoa@exemplo.com', 'senha123'),
    ).rejects.toMatchObject({
      kind: 'unauthorized',
      status: 401,
      message: 'E-mail ou senha inválidos.',
    })
  })

  it('maps desktop role rejection to a safe forbidden error', async () => {
    mockedPost.mockRejectedValueOnce(axiosErrorWithStatus(403, 'Forbidden'))

    await expect(
      authService.login('estudante@exemplo.com', 'senha123'),
    ).rejects.toMatchObject({
      kind: 'forbidden',
      status: 403,
      message: 'Esta conta não possui acesso à gestão desktop.',
    })
  })

  it('maps rate limiting to a dedicated error kind', async () => {
    mockedPost.mockRejectedValueOnce(
      axiosErrorWithStatus(429, 'Too Many Requests'),
    )

    await expect(
      authService.login('pessoa@exemplo.com', 'senha123'),
    ).rejects.toMatchObject({ kind: 'rate-limited', status: 429 })
  })
})
