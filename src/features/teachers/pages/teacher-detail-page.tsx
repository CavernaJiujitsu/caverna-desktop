import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import {
  TeacherUnitLinkForm,
  TeacherUpdateForm,
} from '@/features/teachers/components/teacher-forms'
import {
  useTeacher,
  useTeacherMutations,
} from '@/features/teachers/hooks/use-teachers'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'
import { useSession } from '@/shared/session/session'

export default function TeacherDetailPage() {
  const { teacherId = '' } = useParams<{ teacherId: string }>()
  const navigate = useNavigate()
  const teacher = useTeacher(teacherId)
  const mutations = useTeacherMutations()
  const { selectedContext, session } = useSession()
  const caveId =
    selectedContext?.caveId ??
    session?.caveId ??
    (selectedContext?.role === 'academy'
      ? selectedContext.id.replace(/^academy:/, '')
      : '')

  async function removeTeacher() {
    if (
      !window.confirm(
        'Remover este professor? Esta ação não pode ser desfeita.',
      )
    )
      return
    try {
      await mutations.remove.mutateAsync(teacherId)
      notify.success('Professor removido.')
      navigate(routes.teachers)
    } catch (error) {
      notify.error(
        error instanceof AppError
          ? error.message
          : 'Não foi possível remover o professor.',
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
          message={
            teacher.error instanceof AppError
              ? teacher.error.message
              : 'Não foi possível carregar o professor.'
          }
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
          <section
            className="grid gap-4 rounded-xl border border-border bg-card p-5"
            aria-labelledby="teacher-data-title"
          >
            <h2 id="teacher-data-title" className="text-lg font-semibold">
              Dados disponíveis
            </h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">ID</dt>
                <dd className="break-all font-medium">{teacher.data.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unidades retornadas</dt>
                <dd className="font-medium">
                  {teacher.data.caveUnitIds?.length
                    ? teacher.data.caveUnitIds.join(', ')
                    : 'Não informadas pela API'}
                </dd>
              </div>
            </dl>
          </section>
          <div className="grid gap-6 xl:grid-cols-2">
            <TeacherUpdateForm
              teacher={teacher.data}
              onSaved={() => void teacher.refetch()}
            />
            <TeacherUnitLinkForm teacherId={teacher.data.id} caveId={caveId} action="link" />
            <TeacherUnitLinkForm teacherId={teacher.data.id} caveId={caveId} action="unlink" />
          </div>
        </div>
      )}
    </ManagementShell>
  )
}
