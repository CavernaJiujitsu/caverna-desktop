import { Link, useRouteError } from 'react-router-dom'
import { PageContainer } from '@/shared/components/layout/page-container'

export function ErrorPage() {
  useRouteError() // Do not expose route exception details to end users.
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="mt-2">Recarregue a página ou volte ao início.</p>
      <Link className="mt-4 inline-block underline" to="/">
        Voltar ao início
      </Link>
    </PageContainer>
  )
}
