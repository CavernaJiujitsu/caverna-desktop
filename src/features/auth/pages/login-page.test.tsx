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
import {
  getAccessToken,
  getManagementContextId,
  setAccessToken,
  setManagementContextId,
} from '@/shared/session/access-token'

vi.mock('@/shared/lib/axios', () => ({ http: { post: vi.fn(), get: vi.fn() } }))

const mockedPost = vi.mocked(http.post)
const mockedGet = vi.mocked(http.get)

const userId = '550e8400-e29b-41d4-a716-446655440000'
const practitionerId = '660e8400-e29b-41d4-a716-446655440001'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/login']}>
    <SessionProvider>{children}</SessionProvider>
  </MemoryRouter>
)

const routes = (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/academies" element={<p>Academies route</p>} />
    <Route path="/management" element={<p>Management route</p>} />
  </Routes>
)

function loginResponse(withPractitioner = true) {
  return {
    data: {
      message: 'Login realizado com sucesso',
      data: {
        accessToken: 'token-abc',
        tokenType: 'Bearer',
        expiresIn: 7200,
        userId,
        ...(withPractitioner ? { practitionerId } : {}),
      },
      timestamp: '2026-11-07T12:00:00.000Z',
    },
  }
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
    mockedGet.mockReset()
  })

  afterEach(() => {
    setAccessToken(null)
    setManagementContextId(null)
    vi.restoreAllMocks()
  })

  it('signs in and requires context selection before opening management data', async () => {
    mockedPost.mockResolvedValueOnce(loginResponse())
    mockedGet.mockResolvedValueOnce({
      data: {
        message: 'OK',
        data: [
          {
            id: 'c1',
            role: 'academy',
            label: 'Academia A',
            detail: 'todas as unidades',
          },
        ],
        timestamp: '2026-11-07T12:00:00.000Z',
      },
    })

    render(routes, { wrapper })
    fillCredentials()

    await vi.waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'pessoa@exemplo.com',
        password: 'senha123',
      })
    })

    await vi.waitFor(() => {
      expect(screen.getByText('Management route')).toBeInTheDocument()
    })
    expect(getAccessToken()).toBe('token-abc')
    expect(getManagementContextId()).toBeNull()
    expect(mockedGet).not.toHaveBeenCalled()
    expect(screen.queryByText('Academies route')).not.toBeInTheDocument()
    expect(screen.queryByText(/prévia dos contextos/i)).not.toBeInTheDocument()
  })

  it('accepts management login without creating or requiring a practitioner', async () => {
    mockedPost.mockResolvedValueOnce(loginResponse(false))

    render(routes, { wrapper })
    fillCredentials()

    await vi.waitFor(() => {
      expect(screen.getByText('Management route')).toBeInTheDocument()
    })
    expect(getAccessToken()).toBe('token-abc')
    expect(getManagementContextId()).toBeNull()
  })

  it('shows a safe credential error when login fails with 401', async () => {
    const error = new AxiosError(
      'Unauthorized',
      undefined,
      {} as InternalAxiosRequestConfig,
      undefined,
      {
        data: null,
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
        request: null,
      } as AxiosResponse,
    )
    mockedPost.mockRejectedValueOnce(error)

    render(routes, { wrapper })
    fillCredentials()

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'E-mail ou senha inválidos.',
      )
    })
    // Sensitive internal detail must not leak to the UI.
    expect(screen.queryByText(/Unauthorized/)).not.toBeInTheDocument()
  })
})
