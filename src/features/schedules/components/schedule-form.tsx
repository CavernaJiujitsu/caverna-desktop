import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCaveUnits } from '@/features/academies'
import { useTeacherOptions } from '@/features/teachers/hooks/use-teachers'
import {
  SCHEDULE_DAYS,
  SCHEDULE_SCOPES,
  dateFromSchedule,
  scheduleFormSchema,
  timeFromSchedule,
  type ClassSchedule,
  type CreateScheduleInput,
  type ScheduleFormOutput,
  type ScheduleFormValues,
  type UpdateScheduleInput,
} from '@/features/schedules/schemas/schedule.schema'
import { useScheduleMutations } from '@/features/schedules/hooks/use-schedules'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'
import { AppError } from '@/shared/types/app-error'

function messageForScheduleError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.kind === 'forbidden')
      return 'Você não tem permissão para alterar este horário.'
    if (error.kind === 'not-found')
      return 'Horário, unidade ou professor não encontrado.'
    if (error.kind === 'validation')
      return 'Confira os campos informados e tente novamente.'
    if (error.kind === 'network' || error.kind === 'timeout')
      return 'Não foi possível falar com o servidor. Tente novamente.'
  }
  return 'Não foi possível salvar o horário. Tente novamente.'
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function sixMonthsFromTodayIso(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 6)
  return date.toISOString().slice(0, 10)
}

function defaultValues(schedule?: ClassSchedule): ScheduleFormValues {
  return {
    caveUnitId: schedule?.caveUnitId ?? '',
    teacherId: schedule?.teacherId ?? '',
    title: schedule?.title ?? '',
    dayOfWeek: schedule?.dayOfWeek ?? 1,
    startsAt: schedule ? timeFromSchedule(schedule.startsAt) : '19:00',
    endsAt: schedule ? timeFromSchedule(schedule.endsAt) : '20:30',
    startDate: schedule ? dateFromSchedule(schedule.startDate) : todayIso(),
    endDate: schedule
      ? dateFromSchedule(schedule.endDate)
      : sixMonthsFromTodayIso(),
    capacity: schedule?.capacity ?? 30,
    active: schedule?.active ?? true,
    scope: 'single',
  }
}

type ScheduleFormProps = {
  schedule?: ClassSchedule
  onDone?: () => void
  onCancel?: () => void
}

export function ScheduleForm({
  schedule,
  onDone,
  onCancel,
}: ScheduleFormProps) {
  const editing = Boolean(schedule)
  const { selectedContext } = useSession()
  const caveId = selectedContext?.caveId ?? ''
  const unitsQuery = useCaveUnits(editing ? '' : caveId)
  const teachersQuery = useTeacherOptions(caveId, !editing && Boolean(caveId))
  const units = unitsQuery.data ?? []
  const teachers = teachersQuery.data ?? []
  const mutations = useScheduleMutations()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues, unknown, ScheduleFormOutput>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: defaultValues(schedule),
  })

  const catalogsPending =
    !editing && (!caveId || unitsQuery.isPending || teachersQuery.isPending)
  const catalogsError =
    !editing && (unitsQuery.isError || teachersQuery.isError)
  const pending =
    isSubmitting ||
    mutations.create.isPending ||
    mutations.update.isPending ||
    catalogsPending ||
    catalogsError ||
    (!editing && teachers.length === 0)

  async function submit(values: ScheduleFormOutput) {
    setServerError(null)
    try {
      if (schedule) {
        const input: UpdateScheduleInput = {
          title: values.title,
          dayOfWeek: values.dayOfWeek,
          startsAt: values.startsAt,
          endsAt: values.endsAt,
          startDate: values.startDate,
          endDate: values.endDate,
          capacity: values.capacity,
          active: values.active,
          scope: values.scope,
        }
        const result = await mutations.update.mutateAsync({
          id: schedule.id,
          input,
        })
        notify.success(
          result.scope === 'all'
            ? `Série atualizada (${result.updated} horário(s)).`
            : 'Horário atualizado.',
        )
      } else {
        const input: CreateScheduleInput = {
          ...(values.caveUnitId ? { caveUnitId: values.caveUnitId } : {}),
          teacherId: values.teacherId,
          title: values.title,
          dayOfWeek: values.dayOfWeek,
          startsAt: values.startsAt,
          endsAt: values.endsAt,
          startDate: values.startDate,
          endDate: values.endDate,
          capacity: values.capacity,
          active: values.active,
        }
        await mutations.create.mutateAsync(input)
        notify.success('Horário criado.')
      }
      onDone?.()
    } catch (error) {
      setServerError(messageForScheduleError(error))
    }
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <div className="space-y-2">
        <label htmlFor="schedule-title" className="text-sm font-medium">
          Título
        </label>
        <Input
          id="schedule-title"
          placeholder="Ex.: Treino de Segunda"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'schedule-title-error' : undefined}
          {...register('title')}
        />
        {errors.title && (
          <p
            id="schedule-title-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.title.message}
          </p>
        )}
      </div>

      {editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Unidade</p>
            <p className="text-sm text-muted-foreground">
              {schedule?.caveUnit?.name ?? 'Escopo da caverna'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Professor</p>
            <p className="text-sm text-muted-foreground">
              {schedule?.teacher?.name ?? 'Professor vinculado'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Unidade e professor não são alterados por este formulário para
            respeitar o escopo do backend.
          </p>
        </div>
      ) : (
        <>
          {!caveId && (
            <p role="alert" className="text-sm text-destructive">
              Selecione um contexto de caverna para criar um horário.
            </p>
          )}
          {caveId && catalogsPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Carregando unidades e professores…
            </p>
          )}
          {caveId && unitsQuery.isError && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              <span>Não foi possível carregar as unidades.</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void unitsQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          )}
          {caveId && teachersQuery.isError && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              <span>Não foi possível carregar os professores.</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void teachersQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="schedule-unit" className="text-sm font-medium">
                Unidade
              </label>
              <select
                id="schedule-unit"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                disabled={!caveId || unitsQuery.isPending || unitsQuery.isError}
                aria-invalid={!!errors.caveUnitId}
                {...register('caveUnitId')}
              >
                <option value="">Toda a caverna (todas as unidades)</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {units.length === 0
                  ? 'Sem unidades cadastradas; o horário será aplicado à caverna.'
                  : 'Sem seleção específica, o horário será aplicado à caverna.'}
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="schedule-teacher" className="text-sm font-medium">
                Professor
              </label>
              <select
                id="schedule-teacher"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                disabled={
                  !caveId ||
                  teachersQuery.isPending ||
                  teachersQuery.isError ||
                  teachers.length === 0
                }
                aria-invalid={!!errors.teacherId}
                aria-describedby={
                  errors.teacherId ? 'schedule-teacher-error' : undefined
                }
                {...register('teacherId')}
              >
                <option value="">
                  {teachers.length === 0
                    ? 'Nenhum professor disponível'
                    : 'Selecione um professor'}
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                    {teacher.email ? ` · ${teacher.email}` : ''}
                  </option>
                ))}
              </select>
              {errors.teacherId && (
                <p
                  id="schedule-teacher-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.teacherId.message}
                </p>
              )}
              {caveId &&
                !teachersQuery.isPending &&
                !teachersQuery.isError &&
                teachers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Cadastre um professor antes de criar o horário.
                  </p>
                )}
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <label htmlFor="schedule-day" className="text-sm font-medium">
          Dia da semana
        </label>
        <select
          id="schedule-day"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-invalid={!!errors.dayOfWeek}
          {...register('dayOfWeek', { valueAsNumber: true })}
        >
          {SCHEDULE_DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
        {errors.dayOfWeek && (
          <p role="alert" className="text-sm text-destructive">
            {errors.dayOfWeek.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="schedule-start-time" className="text-sm font-medium">
            Início
          </label>
          <Input
            id="schedule-start-time"
            type="time"
            aria-invalid={!!errors.startsAt}
            {...register('startsAt')}
          />
          {errors.startsAt && (
            <p role="alert" className="text-sm text-destructive">
              {errors.startsAt.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="schedule-end-time" className="text-sm font-medium">
            Término
          </label>
          <Input
            id="schedule-end-time"
            type="time"
            aria-invalid={!!errors.endsAt}
            {...register('endsAt')}
          />
          {errors.endsAt && (
            <p role="alert" className="text-sm text-destructive">
              {errors.endsAt.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="schedule-start-date" className="text-sm font-medium">
            Início do período
          </label>
          <Input
            id="schedule-start-date"
            type="date"
            aria-invalid={!!errors.startDate}
            {...register('startDate')}
          />
          {errors.startDate && (
            <p role="alert" className="text-sm text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="schedule-end-date" className="text-sm font-medium">
            Fim do período
          </label>
          <Input
            id="schedule-end-date"
            type="date"
            aria-invalid={!!errors.endDate}
            {...register('endDate')}
          />
          {errors.endDate && (
            <p role="alert" className="text-sm text-destructive">
              {errors.endDate.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="schedule-capacity" className="text-sm font-medium">
          Capacidade
        </label>
        <Input
          id="schedule-capacity"
          type="number"
          min={1}
          aria-invalid={!!errors.capacity}
          {...register('capacity', { valueAsNumber: true })}
        />
        {errors.capacity && (
          <p role="alert" className="text-sm text-destructive">
            {errors.capacity.message}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" {...register('active')} />
        Horário ativo
      </label>

      {editing && (
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium">
            Aplicar alteração em
          </legend>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {SCHEDULE_SCOPES.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input type="radio" value={option} {...register('scope')} />
                {option === 'single'
                  ? 'Somente este horário'
                  : 'Todos os horários da série'}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            &quot;Somente este horário&quot; altera apenas o registro aberto.
            &quot;Todos os horários da série&quot; altera registros com a mesma
            unidade, professor e título.
          </p>
        </fieldset>
      )}

      {serverError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending && (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          )}
          {editing ? 'Salvar horário' : 'Criar horário'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
