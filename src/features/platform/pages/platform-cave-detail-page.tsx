import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { CaveAdminForm } from '@/features/platform/components/cave-admin-form'
import {
  useArchivePlatformCave,
  useCaveAdminMutations,
  useCaveAdmins,
  usePlatformCave,
  usePlatformCaveUnits,
  useUpdatePlatformCave,
} from '@/features/platform/hooks/use-platform-caves'
import { classService } from '@/features/classes/services/class.service'
import type { ClassItem } from '@/features/classes/schemas/class.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'
import { useSession } from '@/shared/session/session'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

/**
 * Day window for the class preview: the `date` query param (YYYY-MM-DD) or
 * today onwards, so the list shows upcoming classes instead of the oldest.
 */
function classWindow(date: string | null): { from: string; to?: string } {
  if (date) {
    const start = new Date(`${date}T00:00:00`)
    const end = new Date(`${date}T23:59:59.999`)
    if (!Number.isNaN(start.getTime()))
      return { from: start.toISOString(), to: end.toISOString() }
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return { from: today.toISOString() }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CLASSES_PER_PAGE = 8

export function UnitClassesPreview({
  unitName,
  items,
  loading,
}: {
  unitName: string
  items: ClassItem[]
  loading: boolean
}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / CLASSES_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const first = (currentPage - 1) * CLASSES_PER_PAGE

  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2 text-sm font-semibold">Aulas ({items.length})</p>
      {loading ? (
        <LoadingState label="Carregando aulas…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhuma aula"
          description="Nenhuma aula encontrada nesta unidade."
        />
      ) : (
        <>
          <ul
            className="divide-y divide-border"
            aria-label={`Aulas da unidade ${unitName}`}
          >
            {items.slice(first, first + CLASSES_PER_PAGE).map((classItem) => (
              <li key={classItem.id} className="p-3">
                <p className="text-sm font-medium">
                  {classItem.teacherName ?? 'Professor'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(classItem.startsAt)} ·
                  {formatTime(classItem.startsAt)} –
                  {formatTime(classItem.endsAt)}
                </p>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav
              aria-label={`Paginação das aulas de ${unitName}`}
              className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
            >
              <span className="text-xs text-muted-foreground">
                {first + 1}–{Math.min(first + CLASSES_PER_PAGE, items.length)}{' '}
                de {items.length} · Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Próxima
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  )
}

export default function PlatformCaveDetailPage() {
  const { caveId = '' } = useParams<{ caveId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { selectedContext } = useSession()
  const isPlatformAdmin = selectedContext?.role === 'platform'

  const caveQuery = usePlatformCave(caveId)
  const unitsQuery = usePlatformCaveUnits(caveId)
  const adminsQuery = useCaveAdmins(caveId)
  const adminMutations = useCaveAdminMutations(caveId)
  const updateCave = useUpdatePlatformCave()
  const archiveCave = useArchivePlatformCave()

  const cave = caveQuery.data
  const units = unitsQuery.data ?? []
  const admins = adminsQuery.data ?? []

  const [classes, setClasses] = useState<Record<string, ClassItem[]>>({})
  const [classesLoading, setClassesLoading] = useState<Record<string, boolean>>(
    {},
  )

  const dateParam = searchParams.get('date')

  const loadedUnits = unitsQuery.data

  useEffect(() => {
    if (!loadedUnits?.length) return
    const range = classWindow(dateParam)
    const controllers: AbortController[] = []
    loadedUnits.forEach((unit) => {
      setClassesLoading((prev) => ({ ...prev, [unit.id]: true }))
      const ctrl = new AbortController()
      controllers.push(ctrl)
      classService
        .list({ caveUnitId: unit.id, ...range }, ctrl.signal)
        .then((items) => {
          setClasses((prev) => ({ ...prev, [unit.id]: items }))
          setClassesLoading((prev) => ({ ...prev, [unit.id]: false }))
        })
        .catch(() => {
          setClassesLoading((prev) => ({ ...prev, [unit.id]: false }))
        })
    })
    return () => {
      controllers.forEach((ctrl) => ctrl.abort())
    }
  }, [loadedUnits, dateParam])

  async function updateCaveActive(nextActive: boolean) {
    const action = nextActive ? 'reativar' : 'desativar'
    if (
      !window.confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} a caverna "${cave?.name}"?`,
      )
    )
      return
    try {
      await updateCave.mutateAsync({ caveId, input: { active: nextActive } })
      notify.success(`Caverna ${nextActive ? 'reativada' : 'desativada'}.`)
    } catch (error) {
      notify.error(
        error instanceof AppError
          ? error.message
          : `Não foi possível ${action} a caverna.`,
      )
    }
  }

  async function handleArchiveCave() {
    if (!window.confirm(`Arquivar a caverna "${cave?.name}"?`)) return
    try {
      await archiveCave.mutateAsync(caveId)
      notify.success('Caverna arquivada.')
      navigate(routes.platformCaves)
    } catch (error) {
      notify.error(
        error instanceof AppError
          ? error.message
          : 'Não foi possível arquivar a caverna.',
      )
    }
  }

  async function archiveUnit(unitId: string, unitName: string) {
    if (
      !window.confirm(
        `Arquivar a unidade "${unitName}"? Esta ação não pode ser desfeita pela interface.`,
      )
    )
      return
    try {
      await httpDeleteUnit(unitId)
      notify.success('Unidade arquivada.')
      unitsQuery.refetch()
    } catch (error) {
      notify.error(
        error instanceof AppError
          ? error.message
          : 'Não foi possível arquivar a unidade.',
      )
    }
  }

  async function httpDeleteUnit(unitId: string): Promise<void> {
    const { http } = await import('@/shared/lib/axios')
    await http.delete(`/caves/${caveId}/units/${unitId}`)
  }

  async function removeAdmin(adminId: string, name: string) {
    if (
      !window.confirm(`Remover o vínculo de ${name}? A conta será preservada.`)
    )
      return
    try {
      await adminMutations.remove.mutateAsync(adminId)
      notify.success('Vínculo de gestor removido.')
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível remover o vínculo do gestor.'),
      )
    }
  }

  return (
    <ManagementShell>
      <Button asChild variant="ghost" size="sm" className="mb-5">
        <Link to={routes.platformCaves}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para cavernas
        </Link>
      </Button>

      {caveQuery.isPending ? (
        <LoadingState label="Carregando caverna…" />
      ) : caveQuery.isError ? (
        <ErrorState
          message={messageForError(
            caveQuery.error,
            'Não foi possível carregar a caverna.',
          )}
          onRetry={() => void caveQuery.refetch()}
          retryLabel="Tentar novamente"
        />
      ) : !cave ? (
        <EmptyState
          title="Caverna não encontrada"
          description="Escolha uma caverna disponível na lista da plataforma."
        />
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Plataforma / Caverna
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {cave.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${
                  cave.active
                    ? 'bg-green/10 text-green-foreground border border-green/20'
                    : 'bg-amber/10 text-amber-foreground border border-amber/20'
                }`}
              >
                <span className="size-2.5 fill-current" aria-hidden="true" />
                {cave.active ? 'Ativa' : 'Arquivada'}
              </span>
              {isPlatformAdmin && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => updateCaveActive(!cave.active)}
                    disabled={caveQuery.isPending || updateCave.isPending}
                  >
                    {updateCave.isPending ? (
                      <LoaderCircle
                        className="size-3 animate-spin"
                        aria-hidden="true"
                      />
                    ) : cave.active ? (
                      'Desativar'
                    ) : (
                      <>
                        <RotateCcw className="size-3 mr-1" aria-hidden="true" />
                        Reativar
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleArchiveCave}
                    disabled={caveQuery.isPending || archiveCave.isPending}
                  >
                    {archiveCave.isPending ? (
                      <LoaderCircle
                        className="size-3 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 className="size-3" aria-hidden="true" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </header>

          {isPlatformAdmin && (
            <section className="mt-6 rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">Editar caverna</h2>
              <form className="mt-4 grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium">
                  Nome
                  <Input defaultValue={cave.name} disabled={!cave.active} />
                </label>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      notify.info(
                        'Edição de nome ainda não implementada nesta versão.',
                      )
                    }}
                    disabled={!cave.active}
                  >
                    Salvar nome
                  </Button>
                </div>
              </form>
            </section>
          )}

          <section className="mt-8" aria-labelledby="units-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="units-title" className="text-lg font-semibold">
                Unidades
              </h2>
              {isPlatformAdmin && (
                <Button asChild size="sm" variant="outline">
                  <Link
                    to={`${routes.units}?caveId=${encodeURIComponent(caveId)}`}
                  >
                    <Plus className="size-3 mr-1" aria-hidden="true" />
                    Nova unidade
                  </Link>
                </Button>
              )}
            </div>
            <div className="mt-3">
              {unitsQuery.isPending ? (
                <LoadingState label="Carregando unidades…" />
              ) : unitsQuery.isError ? (
                <ErrorState
                  message={messageForError(
                    unitsQuery.error,
                    'Não foi possível carregar as unidades.',
                  )}
                  onRetry={() => void unitsQuery.refetch()}
                  retryLabel="Tentar novamente"
                />
              ) : units.length === 0 ? (
                <EmptyState title="Nenhuma unidade cadastrada" />
              ) : (
                <div className="space-y-3">
                  {units.map((unit) => {
                    const unitClasses = classes[unit.id] ?? []
                    const isLoading = classesLoading[unit.id] ?? false
                    return (
                      <div
                        key={unit.id}
                        className="rounded-lg border border-border bg-card p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-medium">{unit.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {[unit.address, unit.neighborhood]
                                .filter(Boolean)
                                .join(' · ') || 'Endereço não informado'}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                                unit.active
                                  ? 'bg-green/10 text-green-foreground border border-green/20'
                                  : 'bg-amber/10 text-amber-foreground border border-amber/20'
                              }`}
                            >
                              <span
                                className="size-2 fill-current"
                                aria-hidden="true"
                              />
                              {unit.active ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPlatformAdmin && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => archiveUnit(unit.id, unit.name)}
                                disabled={unitsQuery.isPending}
                              >
                                <Trash2 className="size-3" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <UnitClassesPreview
                          key={`${unit.id}:${dateParam ?? ''}`}
                          unitName={unit.name}
                          items={unitClasses}
                          loading={isLoading}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="admins-title">
            <h2 id="admins-title" className="text-lg font-semibold">
              Gestores da caverna
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Somente o administrador da plataforma cria ou remove vínculos.
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div>
                {adminsQuery.isPending ? (
                  <LoadingState label="Carregando gestores…" />
                ) : adminsQuery.isError ? (
                  <ErrorState
                    message={messageForError(
                      adminsQuery.error,
                      'Não foi possível carregar os gestores.',
                    )}
                    onRetry={() => void adminsQuery.refetch()}
                    retryLabel="Tentar novamente"
                  />
                ) : admins.length === 0 ? (
                  <EmptyState title="Nenhum gestor vinculado" />
                ) : (
                  <ul
                    className="divide-y divide-border rounded-lg border border-border bg-card"
                    aria-label="Gestores da caverna"
                  >
                    {admins.map((admin) => (
                      <li
                        key={admin.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-4"
                      >
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {admin.email}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={adminMutations.remove.isPending}
                          onClick={() => void removeAdmin(admin.id, admin.name)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Remover vínculo
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold">Adicionar gestor</h3>
                <div className="mt-4">
                  <CaveAdminForm caveId={caveId} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </ManagementShell>
  )
}
