import { ArrowLeft, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import {
  cavesOf,
  useScopeUnits,
  type ScopeUnit,
} from '@/features/management/hooks/use-scope-units'
import {
  TeacherUpdateForm,
  UnitCheckboxList,
} from '@/features/teachers/components/teacher-forms'
import {
  useTeacher,
  useTeacherMutations,
} from '@/features/teachers/hooks/use-teachers'
import type { Teacher } from '@/features/teachers/schemas/teacher.schema'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'

/**
 * Lists every unit available in the current scope (all caves on the
 * platform, the own cave for a cave admin) so a teacher without any link can
 * still be linked. Each checkbox links/unlinks one unit immediately.
 */
function TeacherUnitsSection({ teacher }: { teacher: Teacher }) {
  const scope = useScopeUnits()
  const mutations = useTeacherMutations()
  const linked = new Set(teacher.caveUnits.map((unit) => unit.id))
  const busy = mutations.linkUnit.isPending || mutations.unlinkUnit.isPending

  async function toggle(unit: ScopeUnit, nextChecked: boolean) {
    const variables = { teacherId: teacher.id, caveUnitId: unit.id }
    try {
      if (nextChecked) {
        await mutations.linkUnit.mutateAsync(variables)
        notify.success(`Professor vinculado a ${unit.name}.`)
      } else {
        await mutations.unlinkUnit.mutateAsync(variables)
        notify.success(`Professor desvinculado de ${unit.name}.`)
      }
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível alterar o vínculo.'),
      )
    }
  }

  return (
    <section
      className="grid gap-4 rounded-xl border border-border bg-card p-5"
      aria-labelledby="teacher-units-title"
    >
      <div>
        <h2 id="teacher-units-title" className="text-lg font-semibold">
          Unidades vinculadas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Marque ou desmarque para vincular o professor. Ele só cria aulas e
          horários nas unidades marcadas.
        </p>
      </div>
      {scope.isPending ? (
        <LoadingState label="Carregando unidades…" />
      ) : scope.isError ? (
        <ErrorState
          message="Não foi possível carregar as unidades disponíveis."
          onRetry={() => void scope.refetch()}
        />
      ) : (
        cavesOf(scope.units).map((cave) => (
          <div key={cave.id} className="grid gap-2">
            <h3 className="text-sm font-semibold">{cave.name}</h3>
            <UnitCheckboxList
              units={scope.units.filter((unit) => unit.caveId === cave.id)}
              checked={(unitId) => linked.has(unitId)}
              disabled={busy}
              onToggle={(unit, nextChecked) => void toggle(unit, nextChecked)}
            />
          </div>
        ))
      )}
      {!scope.isPending && !scope.isError && scope.units.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma unidade ativa disponível neste contexto.
        </p>
      )}
    </section>
  )
}

export default function TeacherDetailPage() {
  const { teacherId = '' } = useParams<{ teacherId: string }>()
  const navigate = useNavigate()
  const teacher = useTeacher(teacherId)
  const mutations = useTeacherMutations()

  async function removeTeacher() {
    if (
      !window.confirm(
        'Remover o perfil de professor? A conta é mantida se tiver outros acessos.',
      )
    )
      return
    try {
      await mutations.remove.mutateAsync(teacherId)
      notify.success('Perfil de professor removido.')
      navigate(routes.teachers)
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível remover o professor.'),
      )
    }
  }

  return (
    <ManagementShell>
      <Button asChild variant="ghost" size="sm" className="mb-5">
        <Link to={routes.teachers}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para professores
        </Link>
      </Button>
      {teacher.isPending ? (
        <LoadingState label="Carregando professor…" />
      ) : teacher.isError ? (
        <ErrorState
          message={getErrorMessage(
            teacher.error,
            'Não foi possível carregar o professor.',
          )}
          onRetry={() => void teacher.refetch()}
        />
      ) : (
        <div className="grid gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Professor
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {teacher.data.name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {teacher.data.email ?? 'E-mail não informado'}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              disabled={mutations.remove.isPending}
              onClick={() => void removeTeacher()}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Remover professor
            </Button>
          </header>
          <div className="grid gap-6 xl:grid-cols-2">
            <TeacherUpdateForm key={teacher.data.id} teacher={teacher.data} />
            <TeacherUnitsSection teacher={teacher.data} />
          </div>
        </div>
      )}
    </ManagementShell>
  )
}
