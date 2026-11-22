import { LoaderCircle, ShieldOff, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { CaveAdminForm } from '@/features/platform/components/cave-admin-form'
import {
  useCaveAdminMutations,
  useCaveAdmins,
  usePlatformCaves,
} from '@/features/platform/hooks/use-platform-caves'
import type { CaveAdmin } from '@/features/platform/schemas/cave.schema'
import { ManagementShell } from '@/features/management/components/management-shell'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'
import { AppError } from '@/shared/types/app-error'

const forbiddenMessage =
  'Você não possui permissão para gerenciar administradores desta caverna'

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof AppError) {
    if (error.kind === 'forbidden') return forbiddenMessage
    if (error.kind === 'not-found') return 'Recurso não encontrado.'
    return error.message
  }
  return fallback
}

export default function CaveAdministratorsPage() {
  const navigate = useNavigate()
  const { selectedContext, session, setSelectedContext } = useSession()
  const isPlatform = selectedContext?.role === 'platform'
  const academyCaveId = selectedContext?.caveId ?? session?.caveId
  const [selectedPlatformCaveId, setSelectedPlatformCaveId] = useState('')
  const selectedCaveId = isPlatform
    ? selectedPlatformCaveId
    : (academyCaveId ?? '')
  const [isAddDialogOpen, setAddDialogOpen] = useState(false)
  const [adminToRevoke, setAdminToRevoke] = useState<CaveAdmin | null>(null)
  const [awaitingOwnRevocation, setAwaitingOwnRevocation] = useState(false)
  const caves = usePlatformCaves({ enabled: isPlatform })
  const admins = useCaveAdmins(selectedCaveId)
  const mutations = useCaveAdminMutations(selectedCaveId)

  useEffect(() => {
    if (!admins.isError || !(admins.error instanceof AppError)) return
    if (admins.error.kind !== 'forbidden') return

    if (awaitingOwnRevocation) {
      notify.error(forbiddenMessage)
      setSelectedContext(null)
      void navigate(routes.management, { replace: true })
    }
  }, [
    admins.error,
    admins.isError,
    awaitingOwnRevocation,
    navigate,
    setSelectedContext,
  ])

  async function confirmRevoke() {
    if (!adminToRevoke) return
    const isOwnAccess = adminToRevoke.userId === session?.user.id
    try {
      await mutations.remove.mutateAsync(adminToRevoke.id)
      setAdminToRevoke(null)
      if (isOwnAccess) {
        setAwaitingOwnRevocation(true)
        notify.success('Seu acesso foi revogado. Validando seus contextos…')
      } else {
        notify.success('Acesso de gestão revogado. A conta não foi excluída.')
      }
    } catch (error) {
      notify.error(errorMessage(error, 'Não foi possível revogar o acesso.'))
    }
  }

  const caveSelection = isPlatform ? (
    <section className="mb-6 max-w-xl" aria-labelledby="cave-selection-title">
      <label
        id="cave-selection-title"
        className="grid gap-2 text-sm font-medium"
      >
        Escolha a caverna
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={selectedCaveId}
          disabled={caves.isPending || caves.isError}
          onChange={(event) => setSelectedPlatformCaveId(event.target.value)}
        >
          <option value="">Selecione uma caverna</option>
          {(caves.data ?? []).map((cave) => (
            <option key={cave.id} value={cave.id}>
              {cave.name}
            </option>
          ))}
        </select>
      </label>
      {caves.isPending ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Carregando cavernas…
        </p>
      ) : null}
      {caves.isError ? (
        <div className="mt-3">
          <ErrorState
            message={errorMessage(
              caves.error,
              'Não foi possível carregar as cavernas.',
            )}
            onRetry={() => void caves.refetch()}
            retryLabel="Tentar novamente"
          />
        </div>
      ) : null}
    </section>
  ) : (
    <p className="mb-6 text-sm text-muted-foreground">
      Caverna atual:{' '}
      <span className="font-medium text-foreground">
        {selectedContext?.label ?? 'Não identificada'}
      </span>
    </p>
  )

  return (
    <ManagementShell>
      <PageHeader
        title="Administradores"
        description="Gerencie os acessos de gestão desta caverna. Revogar acesso não exclui a conta."
      />
      {caveSelection}

      {!selectedCaveId && !isPlatform ? (
        <EmptyState
          title="Caverna não identificada"
          description="Não foi possível identificar a caverna do contexto atual. Volte aos contextos e tente novamente."
        />
      ) : null}
      {!selectedCaveId && isPlatform && !caves.isPending && !caves.isError ? (
        <EmptyState
          title="Escolha uma caverna"
          description="Selecione uma caverna para visualizar e administrar seus acessos."
        />
      ) : null}

      {selectedCaveId ? (
        <section aria-labelledby="admins-list-title">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="admins-list-title" className="text-xl font-semibold">
                Administradores da caverna
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pessoas com acesso de gestão nesta caverna.
              </p>
            </div>
            <Button type="button" onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="size-4" aria-hidden="true" />
              Adicionar administrador
            </Button>
          </div>

          <div className="mt-5">
            {admins.isPending ? (
              <LoadingState label="Carregando administradores…" />
            ) : null}
            {admins.isError ? (
              <ErrorState
                message={errorMessage(
                  admins.error,
                  'Não foi possível carregar os administradores.',
                )}
                onRetry={() => void admins.refetch()}
                retryLabel="Tentar novamente"
              />
            ) : null}
            {!admins.isPending &&
            !admins.isError &&
            admins.data.length === 0 ? (
              <EmptyState
                title="Nenhum administrador vinculado"
                description="Adicione uma conta para conceder o acesso de gestão desta caverna."
              />
            ) : null}
            {!admins.isPending && !admins.isError && admins.data.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full min-w-150 text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Nome
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        E-mail
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-medium"
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.data.map((admin) => (
                      <tr
                        key={admin.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">{admin.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {admin.email}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={mutations.remove.isPending}
                            onClick={() => setAdminToRevoke(admin)}
                          >
                            <ShieldOff className="size-4" aria-hidden="true" />
                            Revogar acesso
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {isAddDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-admin-title"
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="add-admin-title" className="text-xl font-semibold">
                  Adicionar administrador
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conceda apenas acesso de gestão à caverna atual.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar"
                onClick={() => setAddDialogOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-5">
              <CaveAdminForm
                caveId={selectedCaveId}
                onSuccess={() => setAddDialogOpen(false)}
              />
            </div>
          </section>
        </div>
      ) : null}

      {adminToRevoke ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="revoke-admin-title"
            aria-describedby="revoke-admin-description"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 id="revoke-admin-title" className="text-xl font-semibold">
              Revogar acesso?
            </h2>
            <p
              id="revoke-admin-description"
              className="mt-3 text-sm text-muted-foreground"
            >
              {adminToRevoke.name} perderá somente o acesso de gestão desta
              caverna. A conta não será excluída.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdminToRevoke(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={mutations.remove.isPending}
                onClick={() => void confirmRevoke()}
              >
                {mutations.remove.isPending ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                Revogar acesso
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </ManagementShell>
  )
}
