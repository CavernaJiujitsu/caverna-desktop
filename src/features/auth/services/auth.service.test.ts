import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '@/features/auth/services/auth.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({ http: { post: vi.fn() } }))

const mockedPost = vi.mocked(http.post)

describe('authService', () => {
  beforeEach(() => {
    mockedPost.mockReset()
  })

  it('sends credentials to the login endpoint and parses the response', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        accessToken: 'access-token-123',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'pessoa@exemplo.com',
          name: null,
        },
      },
    })

    const response = await authService.login('pessoa@exemplo.com', 'senha123')

    expect(mockedPost).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'pessoa@exemplo.com',
      password: 'senha123',
    })
    expect(response.accessToken).toBe('access-token-123')
    expect(response.user.email).toBe('pessoa@exemplo.com')
  })

  it('calls the logout endpoint', async () => {
    mockedPost.mockResolvedValueOnce({})
    await authService.logout()
    expect(mockedPost).toHaveBeenCalledWith('/api/v1/auth/logout')
  })
})
