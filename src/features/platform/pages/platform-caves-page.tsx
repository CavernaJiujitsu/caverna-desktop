import { Link } from 'react-router-dom'
import {
  LoaderCircle,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import {
  useArchivePlatformCave,
  usePlatformCaves,
  useUpdatePlatformCave,
} from '@/features/platform/hooks/use-platform-caves'
import type { PlatformCave } from '@/features/platform/schemas/cave.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'
import { useSession } from '@/shared/session/session'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

function CaveRow({
  cave,
  onArchive,
  onUpdate,
}: {
  cave: PlatformCave
  onArchive: (caveId: string) => Promise<unknown>
  onUpdate: (caveId: string, active: boolean) => Promise<unknown>
}) {
  const [isArchiving, setIsArchiving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  function handleArchive() {
    if (!window.confirm(`Arquivar a caverna "${cave.name}"?`)) return
    setIsArchiving(true)
    onArchive(cave.id).then(() => {
      notify.success('Caverna arquivada.')
    }).catch((error) => {
      notify.error(
        error instanceof AppError
          ? error.message
          : 'Não foi possível arquivar a caverna.',
      )
    }).finally(() => {
      setIsArchiving(false)
    })
  }

  function handleUpdate() {
    const nextActive = !cave.active
    const action = nextActive ? 'reativar' : 'desativar'
    if (
      !window.confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} a caverna "${cave.name}"?`,
      )
    )
      return
    setIsUpdating(true)
    onUpdate(cave.id, nextActive).then(() => {
      notify.success(`Caverna ${nextActive ? 'reativada' : 'desativada'}.`)
    }).catch((error) => {
      notify.error(
        error instanceof AppError
          ? error.message
          : `Não foi possível ${action} a caverna.`,
      )
    }).finally(() => {
      setIsUpdating(false)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleUpdate}
            disabled={isUpdating || isArchiving}
          >
            {isUpdating ? (
              <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
            ) : cave.active ? (
              'Desativar'
            ) : (
              <span>
                <RotateCcw className="size-3 mr-1" aria-hidden="true" />
                Reativar
              </span>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleArchive}
            disabled={isArchiving || isUpdating}
          >
            {isArchiving ? (
              <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-3" aria-hidden="true" />
            )}
          </Button>
    </div>
  )
}

export default function PlatformCavesPage() {
  const { selectedContext } = useSession()
  const isPlatformAdmin = selectedContext?.role === 'platform'
  const caves = usePlatformCaves()
  const archiveCave = useArchivePlatformCave()
  const updateCave = useUpdatePlatformCave()
  const activeCaves = caves.data?.filter((cave) => cave.active) ?? []
  const unitCount = activeCaves.reduce(
    (total, cave) => total + (cave.units?.length ?? 0),
    0,
  )

  return (
    <ManagementShell>
      <PageHeader
        title="Academias da rede"
        description="Visão global para acompanhamento da operação."
      />
      {!caves.isPending && !caves.isError && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Resumo da rede">
          <article className="rounded-xl border border-border bg-card p-5">
            <p className="text-2xl font-semibold">{activeCaves.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Academias ativas</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-5">
            <p className="text-2xl font-semibold">{unitCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">Unidades da rede</p>
          </article>
        </section>
      )}
      <div className="flex items-center justify-between gap-3 mb-4">
        {!caves.isPending && !caves.isError && isPlatformAdmin && (
          <Button asChild>
            <Link to={routes.platformCavesCreate}>
              <Plus className="size-4 mr-2" aria-hidden="true" />
              Nova caverna
            </Link>
          </Button>
        )}
      </div>

      {caves.isPending ? (
        <LoadingState label="Carregando cavernas…" />
      ) : caves.isError ? (
        <ErrorState
          message={messageForError(
            caves.error,
            'Não foi possível carregar as cavernas.',
          )}
          onRetry={() => void caves.refetch()}
          retryLabel="Tentar novamente"
        />
      ) : caves.data.length === 0 ? (
        <EmptyState
          title="Nenhuma caverna encontrada"
          description={
            isPlatformAdmin
              ? 'Cadastre a primeira caverna usando o botão Nova caverna.'
              : 'Quando uma caverna for cadastrada, ela aparecerá aqui.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-accent text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">Academia</th><th className="px-5 py-3 font-medium">Unidades</th><th className="px-5 py-3 font-medium">Situação</th><th className="px-5 py-3 font-medium">Acompanhamento</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {caves.data.map((cave) => (
                <tr key={cave.id}>
                  <td className="px-5 py-4 font-medium">{cave.name}</td>
                  <td className="px-5 py-4">{cave.units?.length ?? 0} unidade(s)</td>
                  <td className="px-5 py-4"><span className={cave.active ? 'text-primary' : 'text-muted-foreground'}>{cave.active ? 'Ativa' : 'Arquivada'}</span></td>
                  <td className="px-5 py-4"><div className="flex gap-2"><Button asChild variant="link" size="sm"><Link to={`${routes.platformCaves}/${cave.id}`}>Ver academia</Link></Button><CaveRow cave={cave} onArchive={(id) => archiveCave.mutateAsync(id)} onUpdate={(id, active) => updateCave.mutateAsync({ caveId: id, input: { active } })} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ManagementShell>
  )
}
