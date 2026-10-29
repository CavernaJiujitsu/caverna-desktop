import { Link } from 'react-router-dom'
import { PageContainer } from '@/shared/components/layout/page-container'
import { PageHeader } from '@/shared/components/layout/page-header'

export default function LoginPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Login"
        description="Authentication is awaiting the NestJS API contract."
      />
      <p>
        Session transport, CSRF requirements and response schemas must be agreed
        before login is implemented.
      </p>
      <Link to="/" className="mt-4 inline-block underline">
        Explore the local demo
      </Link>
    </PageContainer>
  )
}
