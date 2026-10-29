import { Link } from 'react-router-dom'
import { PageContainer } from '@/shared/components/layout/page-container'

export default function NotFoundPage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link className="mt-4 inline-block underline" to="/">
        Return home
      </Link>
    </PageContainer>
  )
}
