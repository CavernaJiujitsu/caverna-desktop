import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Trash2, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { useAllManagedCaveUnits } from '@/features/academies/hooks/use-academies'
import { usePlatformCaves } from '@/features/platform/hooks/use-platform-caves'
import {
  useStudentMembershipMutations,
  useStudentMemberships,
} from '@/features/memberships/hooks/use-memberships'
import {
  studentLinkFormSchema,
  type StudentLinkFormValues,
} from '@/features/memberships/schemas/membership.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'
import type { ManagementContext } from '@/shared/types/management-context'
import { AppError } from '@/shared/types/app-error'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

function caveIdFromContext(context: ManagementContext | null) {
  if (context?.role !== 'academy') return ''
  if (context.caveId) return context.caveId
  const [scope, caveId] = context.id.split(':')
  return scope === 'academy' ? (caveId ?? '') : ''
}

function StudentLinkForm({ caveUnitId }: { caveUnitId: string }) {
  const mutations = useStudentMembershipMutations()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentLinkFormValues>({
    resolver: zodResolver(studentLinkFormSchema),
    defaultValues: { practitionerId: '' },
  })
  async function submit(values: StudentLinkFormValues) {
    try {
      await mutations.link.mutateAsync({ ...values, caveUnitId })
      reset()
      notify.success('Aluno vinculado à unidade.')
    } catch (error) {
      notify.error(messageForError(error, 'Não foi possível vincular o aluno.'))
    }
  }
  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <h2 className="text-lg font-semibold">Vincular aluno</h2>
      <label className="grid gap-2 text-sm font-medium">
        UUID do praticante
        <Input
          aria-invalid={Boolean(errors.practitionerId)}
          {...register('practitionerId')}
        />
        {errors.practitionerId && (
          <span className="text-destructive">
            {errors.practitionerId.message}
          </span>
        )}
      </label>
      <Button type="submit" disabled={isSubmitting || mutations.link.isPending}>
        {isSubmitting || mutations.link.isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Vincular aluno
      </Button>
    </form>
  )
}

function StudentList({ caveUnitId }: { caveUnitId: string }) {
  const students = useStudentMemberships(caveUnitId)
  const mutations = useStudentMembershipMutations()
  async function unlink(practitionerId: string, name: string) {
    if (!window.confirm(`Desvincular ${name} desta unidade?`)) return
    try {
      await mutations.unlink.mutateAsync({ practitionerId, caveUnitId })
      notify.success('Aluno desvinculado da unidade.')
    } catch (error) {
      notify.error(
        messageForError(error, 'Não foi possível desvincular o aluno.'),
      )
    }
  }
  if (students.isPending) return <LoadingState label="Carregando alunos…" />
  if (students.isError)
    return (
      <ErrorState
        message={messageForError(
          students.error,
          'Não foi possível carregar os alunos.',
        )}
        onRetry={() => void students.refetch()}
      />
    )
  if (students.data.length === 0)
    return (
      <EmptyState
        title="Nenhum aluno vinculado"
        description="Vincule o primeiro aluno a esta unidade."
      />
    )
  return (
    <ul
      className="divide-y divide-border rounded-xl border border-border bg-card"
      aria-label="Alunos da unidade"
    >
      {students.data.map((membership) => (
        <li
          key={membership.id}
          className="flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <div>
            <p className="font-medium">{membership.practitioner.user.name}</p>
            <p className="text-sm text-muted-foreground">
              {membership.practitioner.user.email}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={mutations.unlink.isPending}
            onClick={() =>
              void unlink(
                membership.practitioner.id,
                membership.practitioner.user.name,
              )
            }
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Desvincular
          </Button>
          <Button asChild type="button" size="sm" variant="outline">
            <Link to={routes.evaluations}>Validar faixa</Link>
          </Button>
        </li>
      ))}
    </ul>
  )
}

export default function MembershipsPage() {
  const { selectedContext } = useSession()
  const isPlatformContext = selectedContext?.role === 'platform'
  const caves = usePlatformCaves({ enabled: isPlatformContext })
  const [selectedCaveId, setSelectedCaveId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')

  const caveId = isPlatformContext
    ? caves.isSuccess
      ? (caves.data.find((cave) => cave.id === selectedCaveId)?.id ??
        caves.data[0]?.id ??
        '')
      : ''
    : caveIdFromContext(selectedContext)
  const units = useAllManagedCaveUnits(caveId)
  const activeUnits = units.data?.filter((unit) => unit.active) ?? []
  const selectedUnit = activeUnits.find((unit) => unit.id === selectedUnitId)
  const selectedUnitStillAvailable = Boolean(selectedUnit)

  function changeCave(nextCaveId: string) {
    setSelectedCaveId(nextCaveId)
    setSelectedUnitId('')
  }

  return (
    <ManagementShell>
      <PageHeader
        title="Alunos"
        description="Consulte matrículas por unidade. A aprovação da validação de faixa libera a trilha automaticamente."
      />

      {isPlatformContext ? (
        caves.isPending ? (
          <LoadingState label="Carregando cavernas…" />
        ) : caves.isError ? (
          <ErrorState
            message={messageForError(
              caves.error,
              'Não foi possível carregar as cavernas disponíveis.',
            )}
            onRetry={() => void caves.refetch()}
          />
        ) : caves.data.length === 0 ? (
          <EmptyState
            title="Nenhuma caverna disponível"
            description="Não há cavernas para consultar matrículas neste contexto."
          />
        ) : (
          <label className="mb-4 grid max-w-xl gap-2 text-sm font-medium">
            Caverna
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={caveId}
              onChange={(event) => changeCave(event.target.value)}
            >
              {caves.data.map((cave) => (
                <option key={cave.id} value={cave.id}>
                  {cave.name}
                </option>
              ))}
            </select>
          </label>
        )
      ) : selectedContext?.role === 'academy' && !caveId ? (
        <ErrorState message="O contexto confirmado não informa uma caverna válida." />
      ) : null}

      {caveId && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            {units.isPending ? (
              <LoadingState label="Carregando unidades…" />
            ) : units.isError ? (
              <ErrorState
                message={messageForError(
                  units.error,
                  'Não foi possível carregar as unidades.',
                )}
                onRetry={() => void units.refetch()}
              />
            ) : activeUnits.length === 0 ? (
              <EmptyState
                title="Nenhuma unidade ativa"
                description="Cadastre ou reative uma unidade para gerenciar matrículas."
              />
            ) : (
              <label className="grid max-w-xl gap-2 text-sm font-medium">
                Unidade
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedUnitStillAvailable ? selectedUnitId : ''}
                  onChange={(event) => setSelectedUnitId(event.target.value)}
                >
                  <option value="">Selecione uma unidade</option>
                  {activeUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                      {unit.neighborhood ? ` · ${unit.neighborhood}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>

          {units.isSuccess && activeUnits.length > 0 && !selectedUnit ? (
            <div className="mt-4">
              <EmptyState
                title="Selecione uma unidade"
                description="Escolha uma unidade na lista para ver as matrículas."
              />
            </div>
          ) : null}

          {selectedUnit && (
            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div>
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" aria-hidden="true" />
                  <span>
                    {selectedUnit.name}
                    {selectedUnit.neighborhood
                      ? ` · ${selectedUnit.neighborhood}`
                      : ''}
                  </span>
                </div>
                <StudentList caveUnitId={selectedUnit.id} />
              </div>
              <StudentLinkForm caveUnitId={selectedUnit.id} />
            </section>
          )}
        </>
      )}
    </ManagementShell>
  )
}
