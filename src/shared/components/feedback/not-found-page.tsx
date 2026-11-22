import { Link } from 'react-router-dom'
import { PageContainer } from '@/shared/components/layout/page-container'

export default function NotFoundPage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <Link className="mt-4 inline-block underline" to="/">
        Voltar ao início
      </Link>
    </PageContainer>
  )
}
