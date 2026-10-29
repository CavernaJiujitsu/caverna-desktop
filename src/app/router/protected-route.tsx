import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { PageContainer } from '@/shared/components/layout/page-container'

export function ProtectedRoute() {
  // Auth contracts have not been agreed with the API. Fail closed until then.
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold">
        Authentication integration pending
      </h1>
      <p className="mt-3 text-muted-foreground">
        This route requires a verified session. The API authentication contract
        must be agreed before access is enabled.
      </p>
      <Link className="mt-6 inline-block underline" to={routes.login}>
        Voltar para entrada
      </Link>
    </PageContainer>
  )
}
