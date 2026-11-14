import { Dumbbell } from 'lucide-react'
import { ManagementShell } from '@/features/management/components/management-shell'
import { useWorkouts } from '@/features/workouts/hooks/use-workouts'
import type { WorkoutItem } from '@/features/workouts/schemas/workout.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { AppError } from '@/shared/types/app-error'

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function messageForWorkoutError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.kind === 'forbidden')
      return 'Este piloto exige a permissão de leitura de treinos (workouts:read). Fale com o administrador da plataforma.'
    if (error.kind === 'unauthorized')
      return 'Sua sessão expirou. Entre novamente.'
    if (error.kind === 'network' || error.kind === 'timeout')
      return 'Não foi possível falar com o servidor. Tente novamente.'
  }
  return 'Não foi possível carregar os treinos do piloto.'
}

function WorkoutCard({ item }: { item: WorkoutItem }) {
  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Dumbbell className="size-4" aria-hidden="true" />
        {item.type}
      </div>
      <h2 className="mt-2 text-xl font-semibold">{item.name}</h2>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Início</dt>
          <dd>{formatDateTime(item.startsAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Término</dt>
          <dd>{formatDateTime(item.endsAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Capacidade</dt>
          <dd>{item.capacity}</dd>
        </div>
      </dl>
    </li>
  )
}

export default function WorkoutsPage() {
  const workouts = useWorkouts()

  return (
    <ManagementShell>
      <PageHeader
        title="Treinos (piloto)"
        description="Primeira integração com o endpoint desktop de treinos. Os dados ainda são experimentais."
      />

      {workouts.isPending ? (
        <LoadingState label="Carregando treinos…" />
      ) : workouts.isError ? (
        workouts.error instanceof AppError &&
        workouts.error.kind === 'forbidden' ? (
          <ErrorState message={messageForWorkoutError(workouts.error)} />
        ) : (
          <ErrorState
            message={messageForWorkoutError(workouts.error)}
            onRetry={() => void workouts.refetch()}
            retryLabel="Tentar novamente"
          />
        )
      ) : workouts.data.items.length === 0 ? (
        <EmptyState
          title="Nenhum treino disponível"
          description="Quando o piloto retornar treinos, eles aparecerão aqui."
        />
      ) : (
        <ul
          className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Treinos do piloto"
        >
          {workouts.data.items.map((item) => (
            <WorkoutCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </ManagementShell>
  )
}
