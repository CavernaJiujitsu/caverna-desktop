import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession } from '@/shared/session/session'
import ContextSelectionPage from '@/features/management/pages/context-selection-page'
import { http } from '@/shared/lib/axios'
import type { ManagementContext } from '@/shared/types/management-context'

vi.mock('@/shared/lib/axios', () => ({ http: { post: vi.fn() } }))

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
  const { setContexts } = useSession()
  useEffect(() => {
    setContexts(contexts)
  }, [setContexts, contexts])
  return <>{children}</>
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

  it('switches to the selected context via the API', async () => {
    mockedPost.mockResolvedValueOnce({})

    render(<ContextSelectionPage />, { wrapper })

    fireEvent.click(
      screen.getByRole('button', { name: /Selecionar Academia A/ }),
    )

    await vi.waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        '/api/v1/management/contexts/switch',
        { contextId: 'c1' },
      )
    })
  })
})
