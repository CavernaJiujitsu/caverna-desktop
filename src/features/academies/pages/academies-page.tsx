import { AcademyForm } from '@/features/academies/components/academy-form'
import { useAcademies } from '@/features/academies/hooks/use-academies'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageContainer } from '@/shared/components/layout/page-container'
import { PageHeader } from '@/shared/components/layout/page-header'

export default function AcademiesPage({ demo = false }: { demo?: boolean }) {
  const academies = useAcademies()
  return (
    <PageContainer>
      <PageHeader
        title="Academies"
        description={
            demo ? 'Prévia da gestão de cavernas usando o mesmo contrato da API.' : 'Cadastre e consulte cavernas pela API do Caverna.'
        }
      />
      <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-medium">Add an academy</h2>
          <AcademyForm />
        </section>
        <section aria-label="Academy list">
          {academies.isPending ? (
            <LoadingState label="Loading academies" />
          ) : academies.isError ? (
            <ErrorState
              message="Could not load academies."
              onRetry={() => void academies.refetch()}
            />
          ) : academies.data.length === 0 ? (
            <EmptyState
              title="No academies yet"
              description="Add one using the form."
            />
          ) : (
            <ul className="space-y-3">
              {academies.data.map((academy) => (
                <li className="rounded-lg border p-4" key={academy.id}>
                  {academy.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  )
}
