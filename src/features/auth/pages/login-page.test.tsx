import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { SessionProvider } from '@/shared/session/session-context'
import LoginPage from '@/features/auth/pages/login-page'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({ http: { post: vi.fn(), get: vi.fn() } }))

const mockedPost = vi.mocked(http.post)
const mockedGet = vi.mocked(http.get)

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/login']}>
    <SessionProvider>{children}</SessionProvider>
  </MemoryRouter>
)

describe('LoginPage', () => {
  beforeEach(() => {
    mockedPost.mockReset()
    mockedGet.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('submits credentials to the login endpoint and loads contexts on success', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        accessToken: 'token-abc',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'pessoa@exemplo.com',
          name: null,
        },
      },
    })
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 'c1',
          role: 'academy',
          label: 'Academia A',
          detail: 'todas as unidades',
        },
      ],
    })

    render(<LoginPage />, { wrapper })

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'pessoa@exemplo.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await vi.waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'pessoa@exemplo.com',
        password: 'senha123',
      })
    })

    await vi.waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/management/contexts')
    })
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

    render(<LoginPage />, { wrapper })

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'pessoa@exemplo.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'E-mail ou senha inválidos.',
      )
    })
    // Sensitive internal detail must not leak to the UI.
    expect(screen.queryByText(/Unauthorized/)).not.toBeInTheDocument()
  })
})
