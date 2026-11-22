import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/app/router/protected-route'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession } from '@/shared/session/session'
import { getAccessToken } from '@/shared/session/access-token'
import { writeStoredSession } from '@/shared/session/session-storage'
import type { ManagementContext } from '@/shared/types/management-context'

function WithSession({
  children,
  context,
}: {
  children: React.ReactNode
  context?: ManagementContext
}) {
  const { session, setSelectedContext, setSession } = useSession()
  useEffect(() => {
    setSession({
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'pessoa@exemplo.com',
        name: null,
      },
      accessToken: 'token',
      expiresAt: Date.now() + 7_200_000,
      roles: ['ADMIN'],
    })
    if (context) setSelectedContext(context)
  }, [context, setSelectedContext, setSession])
  return session ? <>{children}</> : null
}

const academyContext: ManagementContext = {
  id: 'academy:cave-1',
  role: 'academy',
  label: 'Academia A',
  detail: 'Todas as unidades',
}

function renderAt(path: string, route: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <Routes>{route}</Routes>
      </SessionProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to login when there is no session', () => {
    renderAt(
      '/academies',
      <>
        <Route
          path="/academies"
          element={
            <ProtectedRoute>
              <p>Protected content</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>Login route</p>} />
      </>,
    )

    expect(screen.getByText('Login route')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to context selection when no context is selected', async () => {
    renderAt(
      '/academies',
      <>
        <Route
          path="/academies"
          element={
            <WithSession>
              <ProtectedRoute>
                <p>Protected content</p>
              </ProtectedRoute>
            </WithSession>
          }
        />
        <Route path="/management" element={<p>Management route</p>} />
      </>,
    )

    expect(await screen.findByText('Management route')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the page when the context role is allowed', async () => {
    renderAt(
      '/schedules',
      <Route
        path="/schedules"
        element={
          <WithSession context={academyContext}>
            <ProtectedRoute allowedContextRoles={['academy', 'teacher']}>
              <p>Allowed content</p>
            </ProtectedRoute>
          </WithSession>
        }
      />,
    )

    expect(await screen.findByText('Allowed content')).toBeInTheDocument()
  })

  it('redirects to access denied when the context role is not allowed', async () => {
    renderAt(
      '/platform/users',
      <>
        <Route
          path="/platform/users"
          element={
            <WithSession context={academyContext}>
              <ProtectedRoute allowedContextRoles={['platform']}>
                <p>Forbidden content</p>
              </ProtectedRoute>
            </WithSession>
          }
        />
        <Route path="/access-denied" element={<p>Access denied route</p>} />
      </>,
    )

    expect(await screen.findByText('Access denied route')).toBeInTheDocument()
    expect(screen.queryByText('Forbidden content')).not.toBeInTheDocument()
  })

  it('allows unit management only in platform or academy contexts', async () => {
    renderAt(
      '/units',
      <>
        <Route
          path="/units"
          element={
            <WithSession
              context={{
                id: 'teacher:teacher-1',
                role: 'teacher',
                label: 'Professor',
                detail: '',
              }}
            >
              <ProtectedRoute allowedContextRoles={['platform', 'academy']}>
                <p>Units content</p>
              </ProtectedRoute>
            </WithSession>
          }
        />
        <Route path="/access-denied" element={<p>Access denied route</p>} />
      </>,
    )

    expect(await screen.findByText('Access denied route')).toBeInTheDocument()
    expect(screen.queryByText('Units content')).not.toBeInTheDocument()
  })

  it('restores a persisted session and context on a protected route', () => {
    writeStoredSession({
      session: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'pessoa@exemplo.com',
          name: null,
        },
        accessToken: 'token-restored',
        expiresAt: Date.now() + 7_200_000,
        roles: ['CAVE_ADMIN'],
      },
      selectedContext: academyContext,
    })

    renderAt(
      '/schedules',
      <Route
        path="/schedules"
        element={
          <ProtectedRoute allowedContextRoles={['academy', 'teacher']}>
            <p>Restored content</p>
          </ProtectedRoute>
        }
      />,
    )

    expect(screen.getByText('Restored content')).toBeInTheDocument()
    expect(getAccessToken()).toBe('token-restored')
  })
})
