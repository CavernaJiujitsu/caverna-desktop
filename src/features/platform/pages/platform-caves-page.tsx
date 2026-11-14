import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { usePlatformCaves } from '@/features/platform/hooks/use-platform-caves'
import type { PlatformCave } from '@/features/platform/schemas/cave.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { AppError } from '@/shared/types/app-error'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

function CaveRow({ cave }: { cave: PlatformCave }) {
  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4" aria-hidden="true" />
            Gestão administrativa
          </div>
          <h2 className="mt-2 text-xl font-semibold">{cave.name}</h2>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to={`${routes.platformCaves}/${cave.id}`}>Abrir</Link>
        </Button>
      </div>
    </li>
  )
}

export default function PlatformCavesPage() {
  const caves = usePlatformCaves()

  return (
    <ManagementShell>
      <PageHeader
        title="Cavernas"
        description="Visão administrativa das cavernas e suas unidades."
      />
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
          description="Quando uma caverna for cadastrada, ela aparecerá aqui."
        />
      ) : (
        <ul className="grid gap-4" aria-label="Cavernas da plataforma">
          {caves.data.map((cave) => (
            <CaveRow key={cave.id} cave={cave} />
          ))}
        </ul>
      )}
    </ManagementShell>
  )
}
