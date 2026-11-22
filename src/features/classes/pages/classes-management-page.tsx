import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ManagementShell } from '@/features/management/components/management-shell'
import { ClassAttendancePanel } from '@/features/classes/components/class-attendance-panel'
import { ClassForm } from '@/features/classes/components/class-form'
import { useClassScope } from '@/features/classes/hooks/use-class-scope'
import {
  useClass,
  useClassMutations,
  useClasses,
} from '@/features/classes/hooks/use-classes'
import {
  CLASS_TYPES,
  CLASS_TYPE_LABELS,
  type ClassItem,
  type ClassType,
} from '@/features/classes/schemas/class.schema'
import {
  addDays,
  endOfDayIso,
  formatClassDate,
  formatTime,
  startOfDayIso,
  toDateInputValue,
} from '@/features/classes/services/class-dates'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm'

type Filters = {
  unitId: string
  teacherId: string
  type: ClassType | ''
  fromDate: string
  toDate: string
}

function catalogsErrorMessage(unitsError: boolean, teachersError: boolean) {
  const failed =
    unitsError && teachersError
      ? 'as unidades e os professores'
      : unitsError
        ? 'as unidades'
        : 'os professores'
  return `Não foi possível carregar ${failed}. Os filtros e o cadastro de aulas ficam incompletos até carregar.`
}

function initialFilters(): Filters {
  const today = new Date()
  return {
    unitId: '',
    teacherId: '',
    type: '',
    fromDate: toDateInputValue(today),
    toDate: toDateInputValue(addDays(today, 7)),
  }
}

export default function ClassesManagementPage() {
  const scope = useClassScope()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [page, setPage] = useState(1)
  // `undefined` = form closed, `null` = creating, item = editing.
  const [editing, setEditing] = useState<ClassItem | null | undefined>()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClassId = searchParams.get('classId') ?? ''
  const selectedClass = useClass(selectedClassId)
  const panelRef = useRef<HTMLDivElement>(null)
  const { remove } = useClassMutations()

  const teacherId = scope.isTeacher ? scope.ownTeacherId : filters.teacherId
  const scopeReady = scope.isTeacher
    ? Boolean(scope.ownTeacherId)
    : Boolean(scope.caveId)
  // The API scopes and paginates: academy contexts send their cave, teacher
  // contexts their own id. Nothing is filtered on the client.
  const query = useClasses(
    {
      caveId: scope.caveId || undefined,
      caveUnitId: filters.unitId || undefined,
      teacherId: teacherId || undefined,
      type: filters.type || undefined,
      from: filters.fromDate ? startOfDayIso(filters.fromDate) : undefined,
      to: filters.toDate ? endOfDayIso(filters.toDate) : undefined,
      page,
    },
    scopeReady,
  )
  const classes = query.data?.items ?? []
  const lastPage = Math.max(query.data?.totalPages ?? 1, 1)
  // A deletion can empty the last page; fall back to the new last one.
  if (query.data && !query.isPlaceholderData && page > lastPage)
    setPage(lastPage)
  const catalogsError = scopeReady && (scope.unitsError || scope.teachersError)

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  function openClass(id: string) {
    setEditing(undefined)
    setSearchParams({ classId: id })
  }

  useEffect(() => {
    if ((selectedClassId || editing !== undefined) && panelRef.current) {
      panelRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedClassId, editing])

  function closeClass() {
    setSearchParams({})
  }

  function canManage(item: ClassItem) {
    return !scope.isTeacher || item.teacherId === scope.ownTeacherId
  }

  async function removeClass(item: ClassItem) {
    if (
      !window.confirm(
        `Excluir a aula de ${formatClassDate(item.startsAt)} em ${item.caveUnitName}?`,
      )
    )
      return
    try {
      await remove.mutateAsync(item.id)
      notify.success('Aula excluída.')
      if (selectedClassId === item.id) closeClass()
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível excluir a aula.'))
    }
  }

  const sidePanel =
    editing !== undefined ? (
      <ClassForm
        key={editing?.id ?? 'new'}
        value={editing}
        scope={scope}
        onClose={() => setEditing(undefined)}
      />
    ) : selectedClassId ? (
      selectedClass.isPending ? (
        <LoadingState label="Carregando aula…" />
      ) : selectedClass.isError ? (
        <ErrorState
          message={getErrorMessage(
            selectedClass.error,
            'Não foi possível carregar a aula.',
          )}
          onRetry={() => void selectedClass.refetch()}
          retryLabel="Tentar novamente"
        />
      ) : (
        <ClassAttendancePanel
          item={selectedClass.data}
          teacherName={scope.teacherName(
            selectedClass.data.teacherId,
            selectedClass.data.teacherName,
          )}
          isClassTeacher={
            scope.isTeacher &&
            selectedClass.data.teacherId === scope.ownTeacherId
          }
          onClose={closeClass}
        />
      )
    ) : null

  return (
    <ManagementShell>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              {scope.isTeacher ? 'Professor' : 'Gestão da caverna'}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {scope.isTeacher ? 'Minhas aulas' : 'Aulas da academia'}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Crie aulas, defina as faixas elegíveis e faça a chamada dos
              inscritos.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              closeClass()
              setEditing(null)
            }}
            disabled={!scopeReady}
          >
            <Plus className="size-4" aria-hidden="true" />
            Criar aula
          </Button>
        </header>

        {!scopeReady && (
          <div className="mt-6">
            <ErrorState message="O contexto selecionado não informa uma caverna ou professor. Troque de contexto e tente novamente." />
          </div>
        )}

        <section
          className="mt-8 rounded-xl border border-border bg-card p-4"
          aria-label="Filtros de aulas"
        >
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <label className="grid gap-2 text-sm font-medium">
              De
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(event) =>
                  updateFilter('fromDate', event.target.value)
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Até
              <Input
                type="date"
                value={filters.toDate}
                onChange={(event) => updateFilter('toDate', event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Unidade
              <select
                className={selectClassName}
                value={filters.unitId}
                onChange={(event) => updateFilter('unitId', event.target.value)}
              >
                <option value="">Todas</option>
                {scope.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </label>
            {!scope.isTeacher && (
              <label className="grid gap-2 text-sm font-medium">
                Professor
                <select
                  className={selectClassName}
                  value={filters.teacherId}
                  onChange={(event) =>
                    updateFilter('teacherId', event.target.value)
                  }
                >
                  <option value="">Todos</option>
                  {scope.teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="grid gap-2 text-sm font-medium">
              Tipo
              <select
                className={selectClassName}
                value={filters.type}
                onChange={(event) =>
                  updateFilter('type', event.target.value as ClassType | '')
                }
              >
                <option value="">Todos</option>
                {CLASS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CLASS_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              className="self-end"
              variant="outline"
              onClick={() => {
                setFilters(initialFilters())
                setPage(1)
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </section>

        {catalogsError && (
          <div className="mt-6">
            <ErrorState
              message={catalogsErrorMessage(
                scope.unitsError,
                scope.teachersError,
              )}
              onRetry={scope.retryCatalogs}
              retryLabel="Tentar novamente"
            />
          </div>
        )}

        {sidePanel ? (
          <div ref={panelRef} className="mt-6 scroll-mt-6">
            {sidePanel}
          </div>
        ) : null}
        <div className="mt-6">
          <section aria-labelledby="class-list-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="class-list-title" className="text-lg font-semibold">
                Aulas no período
              </h2>
              {query.data ? (
                <span className="text-sm text-muted-foreground">
                  {query.data.total} aula(s)
                </span>
              ) : null}
            </div>
            {!scopeReady ? null : query.isPending ? (
              <LoadingState label="Carregando aulas…" />
            ) : query.isError ? (
              <ErrorState
                message={getErrorMessage(
                  query.error,
                  'Não foi possível carregar as aulas.',
                )}
                onRetry={() => void query.refetch()}
                retryLabel="Tentar novamente"
              />
            ) : classes.length === 0 ? (
              <EmptyState
                title="Nenhuma aula encontrada"
                description="Ajuste o período ou os filtros para consultar outras aulas."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table
                  className="w-full min-w-[760px] text-left text-sm"
                  aria-label="Aulas"
                >
                  <thead className="border-b border-border bg-accent/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Aula / data
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Unidade
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Professor
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Vagas
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classes.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          selectedClassId === item.id
                            ? 'bg-accent/60'
                            : 'hover:bg-accent/30'
                        }
                      >
                        <td className="px-4 py-3">
                          <span className="block font-semibold">
                            {CLASS_TYPE_LABELS[item.type]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatClassDate(item.startsAt)} ·{' '}
                            {formatTime(item.startsAt)}–
                            {formatTime(item.endsAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{item.caveUnitName}</td>
                        <td className="px-4 py-3">
                          {scope.teacherName(item.teacherId, item.teacherName)}
                        </td>
                        <td className="px-4 py-3">
                          {item.enrolledCount === undefined
                            ? `${item.capacity} vagas`
                            : `${item.enrolledCount} de ${item.capacity}`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openClass(item.id)}
                            >
                              <Users className="size-4" aria-hidden="true" />
                              Chamada
                            </Button>
                            {canManage(item) && (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    closeClass()
                                    setEditing(item)
                                  }}
                                >
                                  <Pencil
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Editar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={remove.isPending}
                                  onClick={() => void removeClass(item)}
                                >
                                  <Trash2
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Excluir
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {query.data && !query.isError && query.data.totalPages > 1 ? (
              <nav
                className="mt-4 flex items-center justify-end gap-3 text-sm"
                aria-label="Paginação de aulas"
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Anterior
                </Button>
                <span>
                  Página {query.data.page} de {query.data.totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= query.data.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Próxima
                </Button>
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </ManagementShell>
  )
}
