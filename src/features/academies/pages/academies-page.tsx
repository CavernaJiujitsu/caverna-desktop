import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AcademyForm } from '@/features/academies/components/academy-form'
import {
  useAcademies,
  useAcademyMutations,
} from '@/features/academies/hooks/use-academies'
import { ManagementShell } from '@/features/management/components/management-shell'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { routes } from '@/app/router/routes'

export default function AcademiesPage() {
  const academies = useAcademies()
  const mutations = useAcademyMutations()
  const [editingAcademy, setEditingAcademy] = useState<string | null>(null)

  return (
    <ManagementShell>
      <PageHeader
        title="Cavernas"
        description="Cadastre e consulte cavernas pela API do Caverna."
      />
      <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-medium">Cadastrar caverna</h2>
          <AcademyForm />
        </section>
        <section aria-label="Lista de cavernas">
          {academies.isPending ? (
            <LoadingState label="Carregando cavernas" />
          ) : academies.isError ? (
            <ErrorState
              message="Não foi possível carregar as cavernas."
              onRetry={() => void academies.refetch()}
            />
          ) : academies.data.length === 0 ? (
            <EmptyState
              title="Nenhuma caverna cadastrada"
              description="Cadastre uma caverna usando o formulário."
            />
          ) : (
            <ul className="space-y-3">
              {academies.data.map((academy) => (
                <li className="rounded-lg border p-4" key={academy.id}>
                  {editingAcademy === academy.id ? (
                    <AcademyForm
                      academy={academy}
                      onDone={() => setEditingAcademy(null)}
                    />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong>{academy.name}</strong>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {academy.units.length} unidade(s)
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAcademy(academy.id)}
                        >
                          Editar caverna
                        </Button>
                        <Button asChild size="sm" variant="secondary">
                          <Link
                            to={`${routes.units}?caveId=${encodeURIComponent(academy.id)}`}
                          >
                            Gerenciar unidades
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={mutations.remove.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                'Remover esta caverna? Esta ação não pode ser desfeita.',
                              )
                            )
                              mutations.remove.mutate(academy.id)
                          }}
                        >
                          Remover caverna
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ManagementShell>
  )
}
