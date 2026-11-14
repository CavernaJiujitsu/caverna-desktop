import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { SessionProvider } from '@/shared/session/session-context'
import LoginPage from '@/features/auth/pages/login-page'
import { http } from '@/shared/lib/axios'
import { getAccessToken, setAccessToken } from '@/shared/session/access-token'
import { readStoredSession } from '@/shared/session/session-storage'

vi.mock('@/shared/lib/axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/axios')>()
  return { ...actual, http: { post: vi.fn(), get: vi.fn() } }
})

const mockedPost = vi.mocked(http.post)

const userId = '550e8400-e29b-41d4-a716-446655440000'
const caveId = '660e8400-e29b-41d4-a716-446655440001'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/login']}>
    <SessionProvider>{children}</SessionProvider>
  </MemoryRouter>
)

const routes = (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/management" element={<p>Management route</p>} />
  </Routes>
)

function loginResponse(roles: string[] = ['CAVE_ADMIN']) {
  return {
    data: {
      message: 'Login realizado com sucesso',
      data: {
        accessToken: 'token-abc',
        tokenType: 'Bearer',
        expiresIn: 7200,
        userId,
        roles,
        caveId,
      },
      timestamp: '2026-11-07T12:00:00.000Z',
    },
  }
}

function axiosErrorWithStatus(status: number) {
  return new AxiosError(
    String(status),
    undefined,
    {} as InternalAxiosRequestConfig,
    undefined,
    {
      data: null,
      status,
      statusText: String(status),
      headers: {},
      config: {} as InternalAxiosRequestConfig,
      request: null,
    } as AxiosResponse,
  )
}

function fillCredentials() {
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'pessoa@exemplo.com' },
  })
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'senha123' },
  })
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockedPost.mockReset()
  })

  afterEach(() => {
    setAccessToken(null)
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('signs in through the desktop endpoint and opens management', async () => {
    mockedPost.mockResolvedValueOnce(loginResponse())

    render(routes, { wrapper })
    fillCredentials()

    await vi.waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/desktop/auth/login', {
        email: 'pessoa@exemplo.com',
        password: 'senha123',
      })
    })
    await vi.waitFor(() => {
      expect(screen.getByText('Management route')).toBeInTheDocument()
    })
    expect(getAccessToken()).toBe('token-abc')
    const persisted = readStoredSession()
    expect(persisted?.session.accessToken).toBe('token-abc')
    expect(persisted?.session.expiresAt).toBeGreaterThan(Date.now())
    expect(persisted?.selectedContext).toBeNull()
  })

  it('keeps a student-only account on the login page with a safe message', async () => {
    mockedPost.mockResolvedValueOnce(loginResponse(['STUDENT']))

    render(routes, { wrapper })
    fillCredentials()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta conta não possui acesso à gestão desktop.',
    )
    expect(screen.queryByText('Management route')).not.toBeInTheDocument()
    expect(getAccessToken()).toBeNull()
  })

  it('shows a safe credential error when login fails with 401', async () => {
    mockedPost.mockRejectedValueOnce(axiosErrorWithStatus(401))

    render(routes, { wrapper })
    fillCredentials()

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'E-mail ou senha inválidos.',
      )
    })
    expect(screen.queryByText('Management route')).not.toBeInTheDocument()
  })

  it('does not navigate away when the backend rejects desktop access with 403', async () => {
    mockedPost.mockRejectedValueOnce(axiosErrorWithStatus(403))

    render(routes, { wrapper })
    fillCredentials()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta conta não possui acesso à gestão desktop.',
    )
    expect(
      screen.getByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeInTheDocument()
    expect(getAccessToken()).toBeNull()
  })
})
