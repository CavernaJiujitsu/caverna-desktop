import { useEnrollments } from '@/features/classes/hooks/use-classes'
import { ROSTER_STATUS_LABELS } from '@/features/trainings/schemas/training.schema'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { getErrorMessage } from '@/shared/lib/error-message'

const statusTone: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/15 text-emerald-400',
  PENDING: 'bg-primary/15 text-primary',
  IN_PROGRESS: 'bg-primary/15 text-primary',
  EXPIRED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
}

/** Students enrolled in one training; fetched only when the row is open. */
export function TrainingRoster({ classId }: { classId: string }) {
  const enrollments = useEnrollments(classId)

  if (enrollments.isPending)
    return <LoadingState label="Carregando alunos do treino…" />
  if (enrollments.isError)
    return (
      <ErrorState
        message={getErrorMessage(
          enrollments.error,
          'Não foi possível carregar os alunos.',
        )}
        onRetry={() => void enrollments.refetch()}
        retryLabel="Tentar novamente"
      />
    )
  if (enrollments.data.length === 0)
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground">
        Nenhum aluno inscrito.
      </p>
    )

  return (
    <ul className="divide-y divide-border" aria-label="Alunos do treino">
      {enrollments.data.map((enrollment) => (
        <li
          key={enrollment.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
        >
          <div>
            <p className="font-medium">{enrollment.studentName}</p>
            {enrollment.studentEmail ? (
              <p className="text-xs text-muted-foreground">
                {enrollment.studentEmail}
              </p>
            ) : null}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[enrollment.status] ?? ''}`}
          >
            {ROSTER_STATUS_LABELS[enrollment.status]}
          </span>
        </li>
      ))}
    </ul>
  )
}
