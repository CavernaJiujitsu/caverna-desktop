import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, UserCheck, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  useAttendanceMutations,
  useEnrollments,
} from '@/features/classes/hooks/use-classes'
import {
  CLASS_TYPE_LABELS,
  ENROLLMENT_STATUS_LABELS,
  participationFormSchema,
  type ClassItem,
  type Enrollment,
  type EnrollmentStatus,
  type ParticipationFormValues,
} from '@/features/classes/schemas/class.schema'
import {
  formatClassDate,
  formatDateTime,
  formatTime,
  localDateTimeToIso,
  toDateInputValue,
  toTimeInputValue,
} from '@/features/classes/services/class-dates'
import { PractitionerPicker } from '@/features/practitioners/components/practitioner-picker'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'
import { catalogService } from '@/features/belts/services/catalog.service'
import { classLearningService } from '@/features/classes/services/class-learning.service'

const OCCUPYING: EnrollmentStatus[] = ['PENDING', 'IN_PROGRESS', 'CONFIRMED']
const CHECK_IN_ALLOWED: EnrollmentStatus[] = ['PENDING', 'IN_PROGRESS']

const statusTone: Record<EnrollmentStatus, string> = {
  PENDING: 'bg-accent',
  IN_PROGRESS: 'bg-accent',
  CONFIRMED: 'bg-primary text-primary-foreground',
  EXPIRED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
}

function ParticipationForm({
  item,
  enrollment,
  onDone,
}: {
  item: ClassItem
  enrollment: Enrollment
  onDone: () => void
}) {
  const { participation } = useAttendanceMutations(item.id)
  const date = toDateInputValue(new Date(item.startsAt))
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParticipationFormValues>({
    resolver: zodResolver(participationFormSchema),
    defaultValues: {
      startTime: toTimeInputValue(item.startsAt),
      endTime: toTimeInputValue(item.endsAt),
      reason: '',
    },
  })

  async function submit(values: ParticipationFormValues) {
    try {
      await participation.mutateAsync({
        enrollmentId: enrollment.id,
        input: {
          startedAt: localDateTimeToIso(date, values.startTime),
          endedAt: localDateTimeToIso(date, values.endTime),
          reason: values.reason || undefined,
        },
      })
      notify.success('Participação registrada.')
      onDone()
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível registrar a participação.'),
      )
    }
  }

  return (
    <form
      className="mt-3 grid gap-3 rounded-lg border border-border p-3"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
      aria-label={`Participação de ${enrollment.studentName}`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium">
          Entrada
          <Input type="time" {...register('startTime')} />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Saída
          <Input type="time" {...register('endTime')} />
          {errors.endTime && (
            <span className="text-destructive">{errors.endTime.message}</span>
          )}
        </label>
      </div>
      <label className="grid gap-1 text-xs font-medium">
        Motivo (obrigatório ao corrigir um registro)
        <Input {...register('reason')} />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Fechar
        </Button>
        <Button type="submit" size="sm" disabled={participation.isPending}>
          Salvar participação
        </Button>
      </div>
    </form>
  )
}

type ClassAttendancePanelProps = {
  item: ClassItem
  teacherName: string
  /** Check-in and participation are reserved to the class teacher. */
  isClassTeacher: boolean
  onClose: () => void
}

export function ClassAttendancePanel({
  item,
  teacherName,
  isClassTeacher,
  onClose,
}: ClassAttendancePanelProps) {
  const enrollments = useEnrollments(item.id)
  const mutations = useAttendanceMutations(item.id)
  const queryClient = useQueryClient()
  const catalog = useQuery({
    queryKey: ['graduation-catalog'],
    queryFn: catalogService.list,
    enabled: isClassTeacher && item.type === 'SCHEDULED',
  })
  const taught = useQuery({
    queryKey: ['class-content', item.id],
    queryFn: () => classLearningService.content(item.id),
    enabled: isClassTeacher && item.type === 'SCHEDULED',
  })
  const [selectedMovements, setSelectedMovements] = useState<string[] | null>(null)
  const [participationFor, setParticipationFor] = useState<string | null>(null)
  const list = enrollments.data ?? []
  const occupied = list.filter((e) => OCCUPYING.includes(e.status)).length
  const selected = selectedMovements ?? taught.data ?? []

  async function act(action: () => Promise<void>, success: string) {
    try {
      await action()
      notify.success(success)
      await queryClient.invalidateQueries({ queryKey: ['class-content', item.id] })
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível salvar a avaliação.'))
    }
  }

  async function enroll(practitionerId: string, name: string) {
    try {
      await mutations.enroll.mutateAsync(practitionerId)
      notify.success(`${name} inscrito na aula.`)
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível inscrever o aluno.'),
      )
    }
  }

  async function checkIn(enrollment: Enrollment) {
    try {
      await mutations.checkIn.mutateAsync({ enrollmentId: enrollment.id })
      notify.success(`Presença de ${enrollment.studentName} confirmada.`)
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível fazer o check-in.'))
    }
  }

  async function cancel(enrollment: Enrollment) {
    if (!window.confirm(`Cancelar a inscrição de ${enrollment.studentName}?`))
      return
    try {
      await mutations.cancel.mutateAsync({ enrollmentId: enrollment.id })
      notify.success('Inscrição cancelada.')
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível cancelar a inscrição.'),
      )
    }
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-6"
      aria-labelledby="attendance-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Chamada
          </p>
          <h2 id="attendance-title" className="mt-2 text-2xl font-semibold">
            {CLASS_TYPE_LABELS[item.type]} · {item.caveUnitName}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden="true" />
            {formatClassDate(item.startsAt)} · {formatTime(item.startsAt)}–
            {formatTime(item.endsAt)} · {teacherName}
          </p>
          {item.belts.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Faixas: {item.belts.map((belt) => belt.name).join(', ')}
            </p>
          )}
        </div>
        <Button type="button" variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <div className="mt-5 rounded-lg bg-accent p-4">
        <p className="text-sm text-muted-foreground">Vagas ocupadas</p>
        <p className="mt-1 text-2xl font-semibold">
          {occupied}{' '}
          <span className="text-base font-normal text-muted-foreground">
            de {item.capacity}
          </span>
        </p>
      </div>

      {isClassTeacher && item.type === 'SCHEDULED' && catalog.data && (
        <div className="mt-5 space-y-2 rounded-lg border p-4">
          <h3 className="font-semibold">Movimentos ensinados nesta aula</h3>
          <p className="text-xs">Selecione a faixa e seus movimentos antes da chamada.</p>
          {catalog.data.belts.map((belt) => {
            const links = catalog.data.trails.find((trail) => trail.belt.id === belt.id)?.stages
              ?.flatMap((stage) => stage.movements ?? []) ?? []
            return (
              <fieldset key={belt.id} className="space-x-3">
                <legend className="font-medium">{belt.name}</legend>
                {links.map((link) => (
                  <label key={link.id} className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selected.includes(link.id)}
                      onChange={(event) => setSelectedMovements(
                        event.target.checked
                          ? [...selected, link.id]
                          : selected.filter((id) => id !== link.id),
                      )}
                    />
                    {link.movement.name}
                  </label>
                ))}
              </fieldset>
            )
          })}
          <Button type="button" onClick={() => void act(
            () => classLearningService.replace(item.id, selected),
            'Conteúdo da aula salvo.',
          )}>Salvar movimentos ensinados</Button>
        </div>
      )}

      <div className="mt-5">
        <PractitionerPicker
          label="Inscrever aluno"
          actionLabel="Inscrever"
          disabled={mutations.enroll.isPending}
          onSelect={(practitioner) =>
            void enroll(practitioner.id, practitioner.user.name)
          }
        />
      </div>

      {!isClassTeacher && (
        <p className="mt-4 text-xs text-muted-foreground">
          Check-in e participação são registrados pelo professor da aula.
        </p>
      )}

      <div className="mt-5">
        {enrollments.isPending ? (
          <LoadingState label="Carregando inscritos…" />
        ) : enrollments.isError ? (
          <ErrorState
            message={getErrorMessage(
              enrollments.error,
              'Não foi possível carregar os inscritos.',
            )}
            onRetry={() => void enrollments.refetch()}
            retryLabel="Tentar novamente"
          />
        ) : list.length === 0 ? (
          <EmptyState
            title="Nenhum inscrito"
            description="Inscreva alunos pela busca acima."
          />
        ) : (
          <ul
            className="divide-y divide-border"
            aria-label="Lista de inscritos"
          >
            {list.map((enrollment) => (
              <li key={enrollment.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{enrollment.studentName}</p>
                    {enrollment.studentEmail && (
                      <p className="text-xs text-muted-foreground">
                        {enrollment.studentEmail}
                      </p>
                    )}
                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[enrollment.status]}`}
                    >
                      {ENROLLMENT_STATUS_LABELS[enrollment.status]}
                    </span>
                    {enrollment.confirmedAt && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        em {formatDateTime(enrollment.confirmedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isClassTeacher &&
                      CHECK_IN_ALLOWED.includes(enrollment.status) && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={mutations.checkIn.isPending}
                          onClick={() => void checkIn(enrollment)}
                        >
                          <UserCheck className="size-4" aria-hidden="true" />
                          Check-in
                        </Button>
                      )}
                    {isClassTeacher && enrollment.status === 'CONFIRMED' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setParticipationFor(enrollment.id)}
                      >
                        Registrar participação
                      </Button>
                    )}
                    {isClassTeacher && enrollment.status === 'CONFIRMED' && item.type === 'EXAM' && (
                      <>
                        <Button type="button" size="sm" onClick={() => void act(
                          () => classLearningService.exam(item.id, enrollment.id, 'approve'),
                          'Exame aprovado. Próxima faixa liberada.',
                        )}>Aprovar exame</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => void act(
                          () => classLearningService.exam(item.id, enrollment.id, 'reject'),
                          'Exame reprovado. Cinco novas aulas serão exigidas.',
                        )}>Reprovar exame</Button>
                      </>
                    )}
                    {CHECK_IN_ALLOWED.includes(enrollment.status) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={mutations.cancel.isPending}
                        onClick={() => void cancel(enrollment)}
                      >
                        <X className="size-4" aria-hidden="true" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
                {participationFor === enrollment.id && (
                  <ParticipationForm
                    item={item}
                    enrollment={enrollment}
                    onDone={() => setParticipationFor(null)}
                  />
                )}
                {isClassTeacher && item.type === 'SCHEDULED' && enrollment.status === 'CONFIRMED' && (catalog.data?.trails ?? []).flatMap((trail) => trail.stages ?? [])
                  .flatMap((stage) => stage.movements ?? [])
                  .filter((link) => selected.includes(link.id))
                  .map((link) => (
                    <Button key={link.id} className="mr-2 mt-2" type="button" size="sm" variant="outline" onClick={() => void act(
                      () => classLearningService.validate(item.id, enrollment.id, link.id),
                      `Movimento ${link.movement.name} validado.`,
                    )}>Confirmar que aprendeu {link.movement.name}</Button>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
