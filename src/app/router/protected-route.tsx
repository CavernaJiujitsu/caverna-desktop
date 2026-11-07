import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { useSession } from '@/shared/session/session'

type ProtectedRouteProps = { children: ReactNode }

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, selectedContext } = useSession()

  if (!session) return <Navigate to={routes.login} replace />
  if (!selectedContext) return <Navigate to={routes.management} replace />

  return <>{children}</>
}
