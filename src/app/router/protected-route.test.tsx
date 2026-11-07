import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/app/router/protected-route'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession } from '@/shared/session/session'

function WithSession({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useSession()
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
  }, [setSession])
  return session ? <>{children}</> : null
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
})
