import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Trash2, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { ManagementShell } from '@/features/management/components/management-shell'
import {
  useStudentMembershipMutations,
  useStudentMemberships,
} from '@/features/memberships/hooks/use-memberships'
import {
  studentLinkFormSchema,
  unitIdFormSchema,
  type StudentLinkFormValues,
  type UnitIdFormValues,
} from '@/features/memberships/schemas/membership.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

function UnitSelector({
  onSelect,
}: {
  onSelect: (caveUnitId: string) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitIdFormValues>({
    resolver: zodResolver(unitIdFormSchema),
    defaultValues: { caveUnitId: '' },
  })
  return (
    <form
      className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) =>
        void handleSubmit((values) => onSelect(values.caveUnitId))(event)
      }
      noValidate
    >
      <label className="grid flex-1 gap-2 text-sm font-medium">
        UUID da unidade
        <Input
          placeholder="00000000-0000-0000-0000-000000000000"
          aria-invalid={Boolean(errors.caveUnitId)}
          {...register('caveUnitId')}
        />
        {errors.caveUnitId && (
          <span className="text-destructive">{errors.caveUnitId.message}</span>
        )}
      </label>
      <Button type="submit">Consultar alunos</Button>
      <p className="basis-full text-sm text-muted-foreground">
        A API confirma se a unidade pertence à caverna do contexto atual.
      </p>
    </form>
  )
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
        </li>
      ))}
    </ul>
  )
}

export default function MembershipsPage() {
  const [caveUnitId, setCaveUnitId] = useState('')
  return (
    <ManagementShell>
      <PageHeader
        title="Matrículas de alunos"
        description="Consulte e gerencie alunos de uma unidade."
      />
      <UnitSelector onSelect={setCaveUnitId} />
      {!caveUnitId ? (
        <EmptyState
          title="Informe uma unidade"
          description="Use o UUID da unidade para listar seus alunos."
        />
      ) : (
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" aria-hidden="true" />
              <span className="break-all">Unidade {caveUnitId}</span>
            </div>
            <StudentList caveUnitId={caveUnitId} />
          </div>
          <StudentLinkForm caveUnitId={caveUnitId} />
        </section>
      )}
    </ManagementShell>
  )
}
