import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession } from '@/shared/session/session'
import ContextSelectionPage from '@/features/management/pages/context-selection-page'
import { http } from '@/shared/lib/axios'
import { setAccessToken } from '@/shared/session/access-token'
import { AppError } from '@/shared/types/app-error'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), post: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedGet = vi.mocked(http.get)
const mockedPost = vi.mocked(http.post)

const academyContext = {
  id: 'academy:cave-1',
  role: 'academy' as const,
  label: 'Academia A',
  detail: 'Todas as unidades',
}

const teacherContext = {
  id: 'teacher:teacher-1',
  role: 'teacher' as const,
  label: 'Professor B',
  detail: 'Unidade Centro',
}

function contextsResponse() {
  return {
    data: {
      message: 'OK',
      data: [academyContext, teacherContext],
      timestamp: '2026-11-07T12:00:00.000Z',
    },
  }
}

function SessionWithLogin({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useSession()
  useEffect(() => {
    setSession({
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'pessoa@exemplo.com',
        name: null,
      },
      accessToken: 'token',
      expiresAt: Date.now() + 7_200_000,
      roles: ['CAVE_ADMIN', 'TEACHER'],
    })
  }, [setSession])
  return session ? <>{children}</> : null
}

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return (
    <MemoryRouter initialEntries={['/management']}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <SessionWithLogin>{children}</SessionWithLogin>
        </SessionProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('ContextSelectionPage', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
    mockedGet.mockResolvedValue(contextsResponse())
  })

  afterEach(() => {
    setAccessToken(null)
    vi.restoreAllMocks()
  })

  it('renders only the contexts supplied by the backend', async () => {
    render(<ContextSelectionPage />, { wrapper })

    expect(
      await screen.findByRole('button', { name: /Selecionar Academia A/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Academia A')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Selecionar Professor B/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Professor B')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledWith('/management/contexts', {
      signal: expect.any(AbortSignal),
    })
  })

  it('confirms the switch and opens the destination for the role', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { message: 'OK', data: academyContext },
    })

    render(
      <Routes>
        <Route path="/management" element={<ContextSelectionPage />} />
        <Route path="/classes" element={<p>Classes route</p>} />
      </Routes>,
      { wrapper },
    )

    fireEvent.click(
      await screen.findByRole('button', { name: /Selecionar Academia A/ }),
    )

    await vi.waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/management/contexts/switch', {
        contextId: 'academy:cave-1',
      })
    })
    await vi.waitFor(() => {
      expect(screen.getByText('Classes route')).toBeInTheDocument()
    })
  })

  it('shows a safe error and keeps the selection screen when the switch fails', async () => {
    mockedPost.mockRejectedValueOnce(
      new AppError('forbidden', 'Contexto inválido', 403),
    )

    render(
      <Routes>
        <Route path="/management" element={<ContextSelectionPage />} />
        <Route path="/classes" element={<p>Classes route</p>} />
      </Routes>,
      { wrapper },
    )

    fireEvent.click(
      await screen.findByRole('button', { name: /Selecionar Academia A/ }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esse acesso não está mais disponível. Atualize os contextos e escolha novamente.',
    )
    expect(screen.queryByText('Classes route')).not.toBeInTheDocument()
    expect(screen.getByText('Como você quer entrar?')).toBeInTheDocument()
  })

  it('shows an empty state when the account has no management context', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { message: 'OK', data: [] },
    })

    render(<ContextSelectionPage />, { wrapper })

    expect(
      await screen.findByText('Nenhum contexto disponível'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Selecionar/ }),
    ).not.toBeInTheDocument()
  })
})
