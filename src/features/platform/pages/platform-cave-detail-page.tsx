import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { CaveAdminForm } from '@/features/platform/components/cave-admin-form'
import {
  useCaveAdminMutations,
  useCaveAdmins,
  usePlatformCaves,
  usePlatformCaveUnits,
} from '@/features/platform/hooks/use-platform-caves'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

export default function PlatformCaveDetailPage() {
  const { caveId = '' } = useParams<{ caveId: string }>()
  const caves = usePlatformCaves()
  const units = usePlatformCaveUnits(caveId)
  const admins = useCaveAdmins(caveId)
  const adminMutations = useCaveAdminMutations(caveId)
  const cave = caves.data?.find((item) => item.id === caveId)

  async function removeAdmin(adminId: string, name: string) {
    if (
      !window.confirm(`Remover o vínculo de ${name}? A conta será preservada.`)
    )
      return
    try {
      await adminMutations.remove.mutateAsync(adminId)
      notify.success('Vínculo de gestor removido.')
    } catch (error) {
      notify.error(
        messageForError(error, 'Não foi possível remover o vínculo de gestor.'),
      )
    }
  }

  return (
    <ManagementShell>
      <Button asChild variant="ghost" size="sm" className="mb-5">
        <Link to={routes.platformCaves}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para cavernas
        </Link>
      </Button>

      {caves.isPending ? (
        <LoadingState label="Carregando caverna…" />
      ) : caves.isError ? (
        <ErrorState
          message={messageForError(
            caves.error,
            'Não foi possível carregar a caverna.',
          )}
          onRetry={() => void caves.refetch()}
          retryLabel="Tentar novamente"
        />
      ) : !cave ? (
        <EmptyState
          title="Caverna não encontrada"
          description="Escolha uma caverna disponível na lista da plataforma."
        />
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Plataforma / Caverna
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {cave.name}
              </h1>
            </div>
          </header>

          <section className="mt-8" aria-labelledby="units-title">
            <h2 id="units-title" className="text-lg font-semibold">
              Unidades
            </h2>
            <div className="mt-3">
              {units.isPending ? (
                <LoadingState label="Carregando unidades…" />
              ) : units.isError ? (
                <ErrorState
                  message={messageForError(
                    units.error,
                    'Não foi possível carregar as unidades.',
                  )}
                  onRetry={() => void units.refetch()}
                />
              ) : units.data.length === 0 ? (
                <EmptyState title="Nenhuma unidade cadastrada" />
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {units.data.map((unit) => (
                    <li
                      key={unit.id}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <p className="font-medium">{unit.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[unit.address, unit.neighborhood]
                          .filter(Boolean)
                          .join(' · ') || 'Endereço não informado'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="admins-title">
            <h2 id="admins-title" className="text-lg font-semibold">
              Gestores da caverna
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Somente o administrador da plataforma cria ou remove vínculos.
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div>
                {admins.isPending ? (
                  <LoadingState label="Carregando gestores…" />
                ) : admins.isError ? (
                  <ErrorState
                    message={messageForError(
                      admins.error,
                      'Não foi possível carregar os gestores.',
                    )}
                    onRetry={() => void admins.refetch()}
                  />
                ) : admins.data.length === 0 ? (
                  <EmptyState title="Nenhum gestor vinculado" />
                ) : (
                  <ul
                    className="divide-y divide-border rounded-lg border border-border bg-card"
                    aria-label="Gestores da caverna"
                  >
                    {admins.data.map((admin) => (
                      <li
                        key={admin.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-4"
                      >
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {admin.email}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={adminMutations.remove.isPending}
                          onClick={() => void removeAdmin(admin.id, admin.name)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Remover vínculo
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold">Adicionar gestor</h3>
                <div className="mt-4">
                  <CaveAdminForm caveId={caveId} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </ManagementShell>
  )
}
