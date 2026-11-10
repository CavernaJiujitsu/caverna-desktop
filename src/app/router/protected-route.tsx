import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { useSession } from '@/shared/session/session'
import type { ManagementRole } from '@/shared/types/management-context'

type ProtectedRouteProps = {
  children: ReactNode
  allowedRoles?: ManagementRole[]
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { session, selectedContext } = useSession()

  if (!session) return <Navigate to={routes.login} replace />
  if (!selectedContext) return <Navigate to={routes.management} replace />
  if (allowedRoles && !allowedRoles.includes(selectedContext.role))
    return <Navigate to={routes.accessDenied} replace />

  return <>{children}</>
}
