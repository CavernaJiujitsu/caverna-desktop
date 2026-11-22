import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { useSession } from '@/shared/session/session'
import type { ManagementRole } from '@/shared/types/management-context'

type ProtectedRouteProps = {
  children: ReactNode
  /**
   * Context roles allowed to open the page. This is a UX guard only: the
   * backend remains the authority for every request.
   */
  allowedContextRoles?: ManagementRole[]
}

export function ProtectedRoute({
  children,
  allowedContextRoles,
}: ProtectedRouteProps) {
  const { session, selectedContext } = useSession()

  if (!session) return <Navigate to={routes.login} replace />
  if (!selectedContext) return <Navigate to={routes.management} replace />
  if (
    allowedContextRoles &&
    !allowedContextRoles.includes(selectedContext.role)
  )
    return <Navigate to={routes.accessDenied} replace />

  return <>{children}</>
}
