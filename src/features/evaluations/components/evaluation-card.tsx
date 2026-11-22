import { CalendarDays, ClipboardCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { useBelts } from '@/features/belts/hooks/use-belts'
import { CLASS_TYPE_LABELS } from '@/features/classes/schemas/class.schema'
import {
  formatClassDate,
  formatDateTime,
  formatTime,
} from '@/features/classes/services/class-dates'
import {
  useEvaluationMutations,
  useValidationClassOptions,
} from '@/features/evaluations/hooks/use-evaluations'
import {
  EVALUATION_STATUS_LABELS,
  classTeacherId,
  type Evaluation,
} from '@/features/evaluations/services/evaluation.service'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm'

export type EvaluationScope = {
  isTeacher: boolean
  ownTeacherId: string
  /** Academy context cave; empty in teacher contexts. */
  caveId: string
}

type Action = 'schedule' | 'approve' | 'reject'

function ScheduleForm({
  evaluation,
  scope,
  onDone,
}: {
  evaluation: Evaluation
  scope: EvaluationScope
  onDone: () => void
}) {
  const { schedule } = useEvaluationMutations()
  const options = useValidationClassOptions(
    scope.isTeacher
      ? { teacherId: scope.ownTeacherId }
      : { caveId: scope.caveId },
    true,
  )
  const [classId, setClassId] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!classId) return
    try {
      await schedule.mutateAsync({ id: evaluation.id, classId })
      notify.success('Validação agendada. O aluno foi inscrito na aula.')
      onDone()
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível agendar.'))
    }
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
      <label className="grid gap-2 text-sm font-medium">
        Aula da validação (próximos 30 dias)
        <select
          className={selectClassName}
          value={classId}
          disabled={options.isPending || options.isError}
          onChange={(event) => setClassId(event.target.value)}
        >
          <option value="">
            {options.isPending
              ? 'Carregando aulas…'
              : options.isError
                ? 'Não foi possível carregar as aulas'
                : options.data.length === 0
                  ? 'Nenhuma aula disponível'
                  : 'Selecione uma aula'}
          </option>
          {options.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {formatClassDate(item.startsAt)} {formatTime(item.startsAt)} ·{' '}
              {CLASS_TYPE_LABELS[item.type]} · {item.caveUnitName}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-muted-foreground">
        Ao agendar, o aluno é inscrito automaticamente na aula escolhida. A
        aprovação depende do check-in dele nessa aula.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Fechar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!classId || schedule.isPending}
        >
          Agendar
        </Button>
      </div>
    </form>
  )
}

function BeltDecisionForm({
  evaluation,
  mode,
  onDone,
}: {
  evaluation: Evaluation
  mode: 'approve' | 'reject'
  onDone: () => void
}) {
  const belts = useBelts()
  const { approve, reject } = useEvaluationMutations()
  const [beltId, setBeltId] = useState('')
  const [notes, setNotes] = useState('')
  const mutation = mode === 'approve' ? approve : reject
  const beltRequired = mode === 'reject'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (beltRequired && !beltId) return
    const trimmedNotes = notes.trim() || undefined
    try {
      if (mode === 'approve')
        await approve.mutateAsync({
          id: evaluation.id,
          approvedBeltId: beltId || undefined,
          notes: trimmedNotes,
        })
      else
        await reject.mutateAsync({
          id: evaluation.id,
          suggestedBeltId: beltId,
          notes: trimmedNotes,
        })
      notify.success(
        mode === 'approve' ? 'Faixa aprovada.' : 'Validação rejeitada.',
      )
      onDone()
    } catch (error) {
      notify.error(
        getErrorMessage(
          error,
          mode === 'approve'
            ? 'Não foi possível aprovar a faixa.'
            : 'Não foi possível rejeitar a validação.',
        ),
      )
    }
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
      <label className="grid gap-2 text-sm font-medium">
        {mode === 'approve'
          ? 'Faixa aprovada (opcional, padrão: a faixa declarada)'
          : 'Faixa sugerida'}
        <select
          className={selectClassName}
          value={beltId}
          disabled={belts.isPending || belts.isError}
          onChange={(event) => setBeltId(event.target.value)}
        >
          <option value="">
            {mode === 'approve'
              ? `Manter ${evaluation.targetBelt?.name ?? 'faixa declarada'}`
              : 'Selecione uma faixa'}
          </option>
          {belts.data?.map((belt) => (
            <option key={belt.id} value={belt.id}>
              {belt.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Observações (opcional)
        <Input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Fechar
        </Button>
        <Button
          type="submit"
          size="sm"
          variant={mode === 'reject' ? 'destructive' : 'default'}
          disabled={(beltRequired && !beltId) || mutation.isPending}
        >
          {mode === 'approve' ? 'Confirmar aprovação' : 'Confirmar rejeição'}
        </Button>
      </div>
    </form>
  )
}

export function EvaluationCard({
  evaluation,
  scope,
}: {
  evaluation: Evaluation
  scope: EvaluationScope
}) {
  const { cancel } = useEvaluationMutations()
  const [action, setAction] = useState<Action | null>(null)
  const isPending = evaluation.status === 'PENDING'
  const isScheduled = evaluation.status === 'SCHEDULED'
  const isOpen = isPending || isScheduled
  const isClassTeacher =
    scope.isTeacher && classTeacherId(evaluation) === scope.ownTeacherId

  async function cancelEvaluation() {
    if (!window.confirm('Cancelar esta validação de faixa?')) return
    try {
      await cancel.mutateAsync(evaluation.id)
      notify.success('Validação cancelada.')
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível cancelar.'))
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">
            {evaluation.practitioner?.user?.name ?? 'Aluno não informado'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {evaluation.currentBelt
              ? `${evaluation.currentBelt.name} → `
              : 'Faixa declarada: '}
            {evaluation.targetBelt?.name ?? 'não informada'}
            {evaluation.createdAt
              ? ` · solicitada em ${formatDateTime(evaluation.createdAt)}`
              : ''}
          </p>
          {evaluation.class ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDateTime(evaluation.class.startsAt)} ·{' '}
              {evaluation.class.caveUnit?.name ?? 'Unidade'} · Prof.{' '}
              {evaluation.class.teacher?.user?.name ??
                evaluation.teacher?.user?.name ??
                'não informado'}
            </p>
          ) : null}
          {isScheduled && evaluation.class ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Requer check-in do aluno na aula.{' '}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                to={`${routes.classes}?classId=${evaluation.class.id}`}
              >
                Abrir chamada
              </Link>
            </p>
          ) : null}
          {evaluation.notes ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Observações: {evaluation.notes}
            </p>
          ) : null}
          {evaluation.certificateUrl ? (
            <a
              className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
              href={evaluation.certificateUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver certificado
            </a>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold">
          <ClipboardCheck className="size-3" aria-hidden="true" />
          {EVALUATION_STATUS_LABELS[evaluation.status]}
        </span>
      </div>

      {isOpen && (
        <div className="mt-4 flex flex-wrap gap-2">
          {isPending && (
            <Button size="sm" onClick={() => setAction('schedule')}>
              Agendar
            </Button>
          )}
          {isScheduled && isClassTeacher && (
            <Button size="sm" onClick={() => setAction('approve')}>
              Aprovar
            </Button>
          )}
          {(!scope.isTeacher || isClassTeacher) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAction('reject')}
            >
              Rejeitar
            </Button>
          )}
          {!scope.isTeacher && (
            <Button
              size="sm"
              variant="ghost"
              disabled={cancel.isPending}
              onClick={() => void cancelEvaluation()}
            >
              Cancelar
            </Button>
          )}
          {isScheduled && !isClassTeacher && (
            <p className="self-center text-xs text-muted-foreground">
              A aprovação é feita pelo professor da aula.
            </p>
          )}
        </div>
      )}

      {action && (
        <div className="mt-4 rounded-lg border border-border p-4">
          {action === 'schedule' ? (
            <ScheduleForm
              evaluation={evaluation}
              scope={scope}
              onDone={() => setAction(null)}
            />
          ) : (
            <BeltDecisionForm
              evaluation={evaluation}
              mode={action}
              onDone={() => setAction(null)}
            />
          )}
        </div>
      )}
    </article>
  )
}
