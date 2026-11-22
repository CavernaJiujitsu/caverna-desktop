import { CalendarClock, Pencil, PowerOff } from 'lucide-react'
import { useState } from 'react'
import { ManagementShell } from '@/features/management/components/management-shell'
import { ScheduleForm } from '@/features/schedules/components/schedule-form'
import {
  useSchedule,
  useScheduleMutations,
  useSchedules,
} from '@/features/schedules/hooks/use-schedules'
import {
  SCHEDULE_DAYS,
  formatScheduleDate,
  formatScheduleTime,
  scheduleTeacherName,
  type ClassSchedule,
} from '@/features/schedules/schemas/schedule.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

const dayLabel = new Map<number, string>(
  SCHEDULE_DAYS.map((day) => [day.value, day.label]),
)

function messageForScheduleListError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.kind === 'forbidden')
      return 'Sua conta não possui acesso aos horários desta unidade.'
    if (error.kind === 'network' || error.kind === 'timeout')
      return 'Não foi possível falar com o servidor. Tente novamente.'
  }
  return 'Não foi possível carregar os horários.'
}

function ScheduleRow({
  schedule,
  onEdit,
}: {
  schedule: ClassSchedule
  onEdit: () => void
}) {
  const mutations = useScheduleMutations()

  async function deactivate() {
    if (
      !window.confirm(
        `Desativar o horário "${schedule.title}"? Ele deixará de aparecer como ativo.`,
      )
    )
      return
    try {
      await mutations.deactivate.mutateAsync(schedule.id)
      notify.success('Horário desativado.')
    } catch (error) {
      notify.error(messageForScheduleListError(error))
    }
  }

  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="size-4" aria-hidden="true" />
            <span>{schedule.caveUnit?.name ?? 'Escopo da caverna'}</span>
            <span aria-hidden="true">·</span>
            <span>{scheduleTeacherName(schedule)}</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold">{schedule.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {dayLabel.get(schedule.dayOfWeek) ?? 'Dia não informado'} ·{' '}
            {formatScheduleTime(schedule.startsAt)}–
            {formatScheduleTime(schedule.endsAt)} ·{' '}
            {formatScheduleDate(schedule.startDate)} a{' '}
            {formatScheduleDate(schedule.endDate)}
          </p>
          <p className="mt-2 text-sm">
            Capacidade: {schedule.capacity} ·{' '}
            <span
              className={
                schedule.active ? 'text-primary' : 'text-muted-foreground'
              }
            >
              {schedule.active ? 'Ativo' : 'Inativo'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden="true" />
            Editar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!schedule.active || mutations.deactivate.isPending}
            onClick={() => void deactivate()}
          >
            <PowerOff className="size-4" aria-hidden="true" />
            Desativar
          </Button>
        </div>
      </div>
    </li>
  )
}

function EditSchedule({ id, onClose }: { id: string; onClose: () => void }) {
  const schedule = useSchedule(id)

  if (schedule.isPending) return <LoadingState label="Carregando horário…" />
  if (schedule.isError)
    return (
      <ErrorState
        message="Não foi possível carregar o horário."
        onRetry={() => void schedule.refetch()}
        retryLabel="Tentar novamente"
      />
    )
  return (
    <ScheduleForm
      key={schedule.data.id}
      schedule={schedule.data}
      onDone={onClose}
      onCancel={onClose}
    />
  )
}

export default function SchedulesPage() {
  const schedules = useSchedules()
  const [editingId, setEditingId] = useState<string | null>(null)

  const ordered = schedules.data
    ? [...schedules.data].sort(
        (left, right) =>
          left.dayOfWeek - right.dayOfWeek ||
          formatScheduleTime(left.startsAt).localeCompare(
            formatScheduleTime(right.startsAt),
          ),
      )
    : []

  return (
    <ManagementShell>
      <PageHeader
        title="Horários"
        description="Horários recorrentes da academia, com edição de um horário ou de toda a série."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section
          className="h-fit rounded-xl border border-border bg-card p-5"
          aria-labelledby="schedule-form-title"
        >
          <h2 id="schedule-form-title" className="text-lg font-semibold">
            {editingId ? 'Editar horário' : 'Novo horário'}
          </h2>
          <div className="mt-4">
            {editingId ? (
              <EditSchedule id={editingId} onClose={() => setEditingId(null)} />
            ) : (
              <ScheduleForm />
            )}
          </div>
        </section>

        <section aria-labelledby="schedule-list-title">
          <h2 id="schedule-list-title" className="mb-4 text-lg font-semibold">
            Horários cadastrados
          </h2>
          {schedules.isPending ? (
            <LoadingState label="Carregando horários…" />
          ) : schedules.isError ? (
            <ErrorState
              message={messageForScheduleListError(schedules.error)}
              onRetry={() => void schedules.refetch()}
              retryLabel="Tentar novamente"
            />
          ) : ordered.length === 0 ? (
            <EmptyState
              title="Nenhum horário cadastrado"
              description="Crie o primeiro horário recorrente usando o formulário."
            />
          ) : (
            <ul className="grid gap-4" aria-label="Horários recorrentes">
              {ordered.map((schedule) => (
                <ScheduleRow
                  key={schedule.id}
                  schedule={schedule}
                  onEdit={() => setEditingId(schedule.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </ManagementShell>
  )
}
