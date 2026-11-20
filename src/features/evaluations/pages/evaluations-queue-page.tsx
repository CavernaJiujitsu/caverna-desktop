import { useState } from 'react'
import { ManagementShell } from '@/features/management/components/management-shell'
import { EvaluationCard } from '@/features/evaluations/components/evaluation-card'
import { useEvaluations } from '@/features/evaluations/hooks/use-evaluations'
import { EntryVerifyPanel } from '@/features/entries/components/entry-verify-panel'
import {
  EVALUATION_STATUSES,
  EVALUATION_STATUS_LABELS,
  type EvaluationFilterStatus,
} from '@/features/evaluations/services/evaluation.service'
import { useTeacherOptions } from '@/features/teachers/hooks/use-teachers'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { useSession } from '@/shared/session/session'

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm'

export default function EvaluationsQueuePage() {
  const { selectedContext, session } = useSession()
  const isTeacher = selectedContext?.role === 'teacher'
  const caveId =
    selectedContext?.role === 'academy' ? (selectedContext.caveId ?? '') : ''
  const ownTeacherId = isTeacher ? (session?.teacherId ?? '') : ''
  const [status, setStatus] = useState<EvaluationFilterStatus>(
    isTeacher ? 'SCHEDULED' : 'OPEN',
  )
  const [date, setDate] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [page, setPage] = useState(1)
  const teachers = useTeacherOptions(caveId, Boolean(caveId))

  const teacherId = isTeacher ? ownTeacherId : teacherFilter
  const scopeReady = Boolean(caveId || ownTeacherId)
  const query = useEvaluations(
    {
      ...(caveId ? { caveId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(date ? { date } : {}),
      status,
      page,
    },
    scopeReady,
  )
  const evaluations = query.data?.items ?? []
  const lastPage = Math.max(query.data?.totalPages ?? 1, 1)
  // Approving, rejecting or cancelling can empty the last page of a status.
  if (query.data && !query.isPlaceholderData && page > lastPage)
    setPage(lastPage)
  const scope = { isTeacher, ownTeacherId, caveId }

  function changeFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <ManagementShell>
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Validações de faixa
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {isTeacher ? 'Validações das minhas aulas' : 'Fila de graduação'}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Agende a validação em uma aula, faça o check-in do aluno na chamada
            e registre a decisão do professor.
          </p>
        </header>
        {selectedContext?.role === 'academy' ? <EntryVerifyPanel /> : null}

        <section
          className="mt-8 rounded-xl border border-border bg-card p-4"
          aria-label="Filtros da fila"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              Situação
              <select
                className={selectClassName}
                value={status}
                onChange={(event) =>
                  changeFilter(setStatus)(
                    event.target.value as EvaluationFilterStatus,
                  )
                }
              >
                {(['OPEN', ...EVALUATION_STATUSES] as const).map((value) => (
                  <option key={value} value={value}>
                    {EVALUATION_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Data da aula (opcional)
              <Input
                type="date"
                value={date}
                onChange={(event) => changeFilter(setDate)(event.target.value)}
              />
            </label>
            {!isTeacher && (
              <label className="grid gap-2 text-sm font-medium">
                Professor da aula
                <select
                  className={selectClassName}
                  disabled={teachers.isPending || teachers.isError}
                  value={teacherFilter}
                  onChange={(event) =>
                    changeFilter(setTeacherFilter)(event.target.value)
                  }
                >
                  <option value="">Todos os professores</option>
                  {teachers.data?.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>

        <section className="mt-6" aria-labelledby="evaluation-list-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="evaluation-list-title" className="text-lg font-semibold">
              Validações encontradas
            </h2>
            {query.data ? (
              <span className="text-sm text-muted-foreground">
                {query.data.total} validação(ões)
              </span>
            ) : null}
          </div>
          {!scopeReady ? (
            <ErrorState message="Selecione um contexto de caverna ou de professor para consultar a fila de validações." />
          ) : query.isPending ? (
            <LoadingState label="Carregando validações…" />
          ) : query.isError ? (
            <ErrorState
              message={getErrorMessage(
                query.error,
                'Não foi possível carregar a fila.',
              )}
              onRetry={() => void query.refetch()}
              retryLabel="Tentar novamente"
            />
          ) : evaluations.length === 0 ? (
            <EmptyState
              title="Nenhuma validação encontrada"
              description="Ajuste a situação, a data ou o professor para consultar outras validações."
            />
          ) : (
            <div className="grid gap-3">
              {evaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  scope={scope}
                />
              ))}
            </div>
          )}
          {scopeReady &&
          query.data &&
          !query.isError &&
          query.data.totalPages > 1 ? (
            <nav
              className="mt-4 flex items-center justify-end gap-3 text-sm"
              aria-label="Paginação de validações"
            >
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Anterior
              </Button>
              <span>
                Página {query.data.page} de {query.data.totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= query.data.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Próxima
              </Button>
            </nav>
          ) : null}
        </section>
      </div>
    </ManagementShell>
  )
}
