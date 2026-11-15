import { CalendarDays, Check, ClipboardCheck } from 'lucide-react'
import { useState } from 'react'
import {
  useApproveEvaluation,
  useEvaluations,
} from '@/features/evaluations/hooks/use-evaluations'
import { useTeacherOptions } from '@/features/teachers/hooks/use-teachers'
import { ManagementShell } from '@/features/management/components/management-shell'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'

export default function EvaluationsQueuePage() {
  const { selectedContext, session } = useSession()
  const isTeacher = selectedContext?.role === 'teacher'
  const caveId =
    selectedContext?.role === 'academy' ? (selectedContext.caveId ?? '') : ''
  const [filters, setFilters] = useState({
    date: '',
    teacherId: '',
    status: 'PENDING' as const,
  })
  const teacherId = isTeacher ? (session?.teacherId ?? '') : filters.teacherId
  const query = useEvaluations({
    ...filters,
    caveId,
    teacherId,
    status: isTeacher ? 'SCHEDULED' : 'PENDING',
  })
  const teachers = useTeacherOptions(caveId, Boolean(caveId))
  const approve = useApproveEvaluation()

  return (
    <ManagementShell>
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Avaliações
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {isTeacher ? 'Validações das minhas aulas' : 'Fila de graduação'}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {isTeacher
              ? 'Validações agendadas para suas aulas com presença confirmada.'
              : 'Alunos desta caverna que declararam faixa e aguardam validação.'}
          </p>
        </header>
        <section
          className="mt-8 rounded-xl border border-border bg-card p-4"
          aria-label="Filtros da fila"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Data da aula (opcional)
              <Input
                type="date"
                value={filters.date}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Professor
              <select
                className="h-10 rounded-md border border-input bg-background px-3"
                disabled={teachers.isLoading || teachers.isError}
                value={filters.teacherId}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    teacherId: event.target.value,
                  }))
                }
              >
                <option value="">Todos os professores</option>
                {teachers.data?.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {teachers.isLoading ? (
                <span className="text-xs text-muted-foreground">
                  Carregando professores…
                </span>
              ) : teachers.isError ? (
                <span className="text-xs text-destructive">
                  Não foi possível carregar professores.
                </span>
              ) : null}
            </label>
          </div>
        </section>
        {!caveId && !teacherId ? (
          <ErrorState message="Selecione um contexto de caverna para consultar a fila de validações." />
        ) : null}
        <section className="mt-6" aria-labelledby="evaluation-list-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="evaluation-list-title" className="text-lg font-semibold">
              Avaliações encontradas
            </h2>
            <span className="text-sm text-muted-foreground">
              {query.data?.length ?? 0} avaliação(ões)
            </span>
          </div>
          {!caveId && !teacherId ? null : query.isLoading ? (
            <LoadingState label="Carregando avaliações…" />
          ) : query.isError ? (
            <ErrorState
              message="Não foi possível carregar a fila."
              onRetry={() => query.refetch()}
            />
          ) : !query.data?.length ? (
            <EmptyState
              title="Nenhuma avaliação encontrada"
              description="Nenhum aluno desta caverna aguarda validação de faixa."
            />
          ) : (
            <div className="grid gap-3">
              {query.data.map((item) => {
                const classStart =
                  item.class?.startsAt ?? item.scheduledAt ?? item.createdAt
                const status =
                  item.status === 'SCHEDULED'
                    ? 'Agendada'
                    : item.status === 'APPROVED'
                      ? 'Aprovada'
                      : item.status === 'REJECTED'
                        ? 'Rejeitada'
                        : 'Pendente'
                const canApprove = item.status === 'SCHEDULED'
                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="size-4" aria-hidden="true" />
                          {classStart
                            ? new Date(classStart).toLocaleString('pt-BR')
                            : 'Data não informada'}{' '}
                          ·{' '}
                          {item.class?.caveUnit?.name ??
                            'Unidade não informada'}
                        </div>
                        <h3 className="mt-2 text-xl font-semibold">
                          {item.practitioner?.user?.name ??
                            'Aluno não informado'}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.targetBelt?.name ?? 'Faixa não informada'} ·
                          Prof.{' '}
                          {item.teacher?.user?.name ??
                            item.teacher?.id ??
                            'Professor não informado'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold">
                          <ClipboardCheck
                            className="size-3"
                            aria-hidden="true"
                          />
                          {status}
                        </span>
                        {canApprove ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                            disabled={approve.isPending}
                            onClick={() => {
                              approve.mutate(item.id, {
                                onSuccess: () =>
                                  notify.success('Faixa aprovada.'),
                                onError: () =>
                                  notify.error(
                                    'Não foi possível aprovar a faixa.',
                                  ),
                              })
                            }}
                          >
                            <Check className="size-4" aria-hidden="true" />
                            Aprovar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </ManagementShell>
  )
}
