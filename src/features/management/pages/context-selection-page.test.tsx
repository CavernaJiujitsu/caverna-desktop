import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession } from '@/shared/session/session'
import ContextSelectionPage from '@/features/management/pages/context-selection-page'
import { http } from '@/shared/lib/axios'
import { setAccessToken } from '@/shared/session/access-token'
import type { ManagementContext } from '@/shared/types/management-context'

vi.mock('@/shared/lib/axios', () => ({
  http: { post: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedPost = vi.mocked(http.post)

const contexts = [
  {
    id: 'c1',
    role: 'academy' as const,
    label: 'Academia A',
    detail: 'todas as unidades',
  },
  {
    id: 'c2',
    role: 'teacher' as const,
    label: 'Professor B',
    detail: 'unidade ilustrativa',
  },
]

function SessionWithContexts({
  children,
  contexts,
}: {
  children: React.ReactNode
  contexts: ManagementContext[]
}) {
  const { session, setContexts, setSession } = useSession()
  useEffect(() => {
    setSession({
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'pessoa@exemplo.com',
        name: null,
      },
      accessToken: 'token',
      practitionerId: '660e8400-e29b-41d4-a716-446655440001',
    })
    setContexts(contexts)
  }, [setContexts, setSession, contexts])
  return session ? <>{children}</> : null
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/management']}>
    <SessionProvider>
      <SessionWithContexts contexts={contexts}>{children}</SessionWithContexts>
    </SessionProvider>
  </MemoryRouter>
)

describe('ContextSelectionPage', () => {
  beforeEach(() => {
    mockedPost.mockReset()
  })

  afterEach(() => {
    setAccessToken(null)
    vi.restoreAllMocks()
  })

  it('renders only the contexts supplied by the session', () => {
    render(<ContextSelectionPage />, { wrapper })

    expect(
      screen.getByRole('button', { name: /Selecionar Academia A/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Selecionar Professor B/ }),
    ).toBeInTheDocument()
  })

  it('switches context and opens the destination for the selected role', async () => {
    mockedPost.mockResolvedValueOnce({})

    render(
      <Routes>
        <Route path="/management" element={<ContextSelectionPage />} />
        <Route path="/academies" element={<p>Academies route</p>} />
      </Routes>,
      { wrapper },
    )

    fireEvent.click(
      screen.getByRole('button', { name: /Selecionar Academia A/ }),
    )

    await vi.waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        '/api/v1/management/contexts/switch',
        { contextId: 'c1' },
      )
    })
    await vi.waitFor(() => {
      expect(screen.getByText('Academies route')).toBeInTheDocument()
    })
  })

  it('keeps the local selection when the switch endpoint is unavailable', async () => {
    mockedPost.mockRejectedValueOnce(new Error('Not Found'))

    render(
      <Routes>
        <Route path="/management" element={<ContextSelectionPage />} />
        <Route path="/academies" element={<p>Academies route</p>} />
      </Routes>,
      { wrapper },
    )

    fireEvent.click(
      screen.getByRole('button', { name: /Selecionar Academia A/ }),
    )

    await vi.waitFor(() => {
      expect(screen.getByText('Academies route')).toBeInTheDocument()
    })
  })
})
