import { useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { useSession } from '@/shared/session/session'
import { PageContainer } from '@/shared/components/layout/page-container'

type ProtectedRouteProps = { children?: React.ReactNode }

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const { session, selectedContext } = useSession()

  if (!session) {
    navigate(routes.login, { replace: true })
    return null
  }

  if (!selectedContext) {
    navigate(routes.management, { replace: true })
    return null
  }

  return <PageContainer>{children}</PageContainer>
}
