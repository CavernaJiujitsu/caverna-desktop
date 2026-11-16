import { routes } from '@/app/router/routes'
import { useCaveUnits } from '@/features/academies'
import { useAcademies } from '@/features/academies/hooks/use-academies'
import { ManagementShell } from '@/features/management/components/management-shell'
import { TeacherUpdateForm } from '@/features/teachers/components/teacher-forms'
import {
  useTeacher,
  useTeacherCaveUnits,
  useTeacherMutations,
} from '@/features/teachers/hooks/use-teachers'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'
import { AppError } from '@/shared/types/app-error'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Academy } from '@/features/academies/schemas/academy.schema'

export default function TeacherDetailPage() {
  const { teacherId = '' } = useParams<{ teacherId: string }>()
  const navigate = useNavigate()
  const teacher = useTeacher(teacherId)
  const mutations = useTeacherMutations()
  const { selectedContext } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [pendingAdd, setPendingAdd] = useState<Set<string>>(new Set())

  const baseCaveId =
    selectedContext?.caveId ??
    (selectedContext?.role === 'academy'
      ? selectedContext.id.replace(/^academy:/, '')
      : '')

  const isPlatformContext = selectedContext?.role === 'platform'
  const caves = useAcademies()

  const linkedUnits = useTeacherCaveUnits(teacherId)
  const linkedSet = new Set(linkedUnits.data ?? [])

  const allCaves = caves.data ?? []
  const relevantCaves = isPlatformContext
    ? allCaves
    : allCaves.filter((c) => c.id === baseCaveId)

  async function saveAllLinks() {
    const toAdd = [...pendingAdd]
    if (toAdd.length === 0) return

    setIsSaving(true)
    try {
      await Promise.all(
        toAdd.map((id) =>
          mutations.linkUnit.mutateAsync({ teacherId, caveUnitId: id }),
        ),
      )
      notify.success('Vínculos de unidades atualizados.')
      setPendingAdd(new Set())
      await linkedUnits.refetch()
    } catch {
      notify.error('Não foi possível atualizar os vínculos de unidades.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleLink(unitId: string) {
    setPendingAdd((prev) => {
      const next = new Set(prev)
      next.add(unitId)
      return next
    })
  }

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
            </dl>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <TeacherUpdateForm
              teacher={teacher.data}
              onSaved={() => void teacher.refetch()}
            />
            <section className="grid gap-4 rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">Gerenciar unidades</h2>
              <p className="text-sm text-muted-foreground">
                Vincule ou desvincule este professor a unidades de uma caverna.
              </p>

              {caves.isPending ? (
                <EmptyState
                  title="Carregando cavernas…"
                  description="Aguarde enquanto as cavernas disponíveis são buscadas."
                />
              ) : caves.isError ? (
                <ErrorState
                  message={
                    caves.error instanceof AppError
                      ? caves.error.message
                      : 'Não foi possível carregar as cavernas disponíveis.'
                  }
                  onRetry={() => void caves.refetch()}
                />
              ) : relevantCaves.length === 0 ? (
                <EmptyState
                  title="Nenhuma caverna disponível"
                  description="Não há cavernas para gerenciar neste contexto."
                />
              ) : (
                <div className="grid gap-4">
                  {relevantCaves.map((cave) => (
                    <CaveUnitsCard
                      key={cave.id}
                      cave={cave}
                      linkedSet={linkedSet}
                      pendingAdd={pendingAdd}
                      onLink={handleLink}
                    />
                  ))}
                </div>
              )}

              {pendingAdd.size > 0 && (
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={saveAllLinks}
                  className="mt-4"
                >
                  {isSaving ? 'Salvando…' : 'Salvar vínculos'}
                </Button>
              )}
            </section>
          </div>
        </div>
      )}
    </ManagementShell>
  )
}

function CaveUnitsCard({
  cave,
  linkedSet,
  pendingAdd,
  onLink,
}: {
  cave: Academy
  linkedSet: Set<string>
  pendingAdd: Set<string>
  onLink: (unitId: string) => void
}) {
  const unitsQuery = useCaveUnits(cave.id)
  const units = unitsQuery.data ?? []

  if (unitsQuery.isPending) {
    return <LoadingState label={`Carregando unidades de ${cave.name}…`} />
  }
  if (unitsQuery.isError) {
    return (
      <ErrorState
        message={
          unitsQuery.error instanceof AppError
            ? unitsQuery.error.message
            : 'Não foi possível carregar as unidades da caverna.'
        }
        onRetry={() => void unitsQuery.refetch()}
      />
    )
  }

  const linkedInCave = units.filter((u) => linkedSet.has(u.id))
  const effectiveLinked = new Set(linkedSet)
  pendingAdd.forEach((id) => effectiveLinked.add(id))

  // Req 1: mostra apenas cavernas que o professor já está vinculado (pelo menos 1 unidade)
  // Req 2: some da lista quando todas as unidades estiverem vinculadas
  if (linkedInCave.length === 0 || effectiveLinked.size === units.length) {
    return null
  }

  // Req 3: mostra apenas unidades ainda não vinculadas
  const nonLinkedUnits = units.filter((u) => !effectiveLinked.has(u.id))

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{cave.name}</h3>
      <p className="text-xs text-muted-foreground">
        {linkedInCave.length} de {units.length} unidade(s) vinculada(s) a esta
        caverna.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
        {nonLinkedUnits.map((unit) => (
          <label
            key={unit.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer select-none hover:bg-accent/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={pendingAdd.has(unit.id)}
              onChange={() => onLink(unit.id)}
              className="shrink-0 text-primary ring-offset-white"
            />
            {unit.name}
          </label>
        ))}
      </div>
    </div>
  )
}
