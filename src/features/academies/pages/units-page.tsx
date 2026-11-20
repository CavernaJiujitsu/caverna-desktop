import { Search, Trash2, RotateCcw, Pencil } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ManagementShell } from '@/features/management/components/management-shell'
import type { UnitPage } from '@/features/academies/services/academy.service'
import { routes } from '@/app/router/routes'
import {
  useAcademies,
  useCaveUnitPage,
  useUnitManagementMutations,
} from '@/features/academies/hooks/use-academies'
import { UnitForm } from '@/features/academies/components/unit-form'
import type { ManagedUnit } from '@/features/academies/schemas/unit.schema'
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

const PAGE_SIZE = 20

function caveIdFromContext(context: ManagementContext | null) {
  if (context?.role !== 'academy') return ''
  if (context.caveId) return context.caveId
  const [scope, caveId] = context.id.split(':')
  return scope === 'academy' ? (caveId ?? '') : ''
}

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

function unitLocation(unit: ManagedUnit) {
  if (unit.latitude == null || unit.longitude == null)
    return 'Coordenadas não informadas'
  return `${unit.latitude}, ${unit.longitude}`
}

export default function UnitsPage() {
  const { selectedContext } = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isPlatformContext = selectedContext?.role === 'platform'
  const caves = useAcademies({ enabled: isPlatformContext })
  const [selectedCaveId, setSelectedCaveId] = useState(
    searchParams.get('caveId') ?? '',
  )
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)

  const caveId = isPlatformContext
    ? caves.isSuccess
      ? (caves.data.find((cave) => cave.id === selectedCaveId)?.id ??
        caves.data[0]?.id ??
        '')
      : ''
    : caveIdFromContext(selectedContext)
  const units = useCaveUnitPage(caveId, {
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
  })
  const mutations = useUnitManagementMutations(caveId)
  const totalPages = Math.max(units.data?.totalPage ?? 1, 1)

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function changeCave(nextCaveId: string) {
    setSelectedCaveId(nextCaveId)
    setSearchParams({ caveId: nextCaveId }, { replace: true })
    setPage(1)
    setEditingUnitId(null)
  }

  async function archive(unit: ManagedUnit) {
    if (
      !window.confirm(
        `Arquivar "${unit.name}"? A unidade, seus vínculos e histórico serão preservados.`,
      )
    )
      return
    try {
      await mutations.archive.mutateAsync(unit.id)
      notify.success('Unidade arquivada.')
      setEditingUnitId(null)
      if ((units.data?.items.length ?? 0) <= 1 && page > 1)
        setPage((current) => current - 1)
    } catch (error) {
      notify.error(
        messageForError(error, 'Não foi possível arquivar a unidade.'),
      )
    }
  }

  async function reactivate(unit: ManagedUnit) {
    try {
      await mutations.reactivate.mutateAsync(unit.id)
      notify.success('Unidade reativada.')
    } catch (error) {
      notify.error(
        messageForError(error, 'Não foi possível reativar a unidade.'),
      )
    }
  }

  let unitPage: UnitPage | undefined
  if (units.data) unitPage = units.data

  return (
    <ManagementShell>
      <PageHeader
        title="Unidades da academia"
        description="Aulas e professores têm acesso organizado por unidade."
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
            description="Não há cavernas para gerenciar neste contexto."
          />
        ) : (
          <label className="mb-6 grid max-w-xl gap-2 text-sm font-medium">
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
        <div className="space-y-8">
          <section aria-labelledby="units-list-title">
            <form
              className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4"
              onSubmit={applySearch}
              role="search"
            >
              <label className="sr-only" htmlFor="unit-search">
                Buscar unidades
              </label>
              <Input
                id="unit-search"
                className="min-w-52 flex-1"
                type="search"
                placeholder="Buscar por nome, endereço ou bairro"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <Button type="submit">
                <Search className="size-4" aria-hidden="true" />
                Buscar
              </Button>
            </form>

            <h2 id="units-list-title" className="mt-6 text-lg font-semibold">
              Unidades cadastradas
            </h2>
            <div className="mt-3">
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
              ) : unitPage?.items.length === 0 ? (
                <EmptyState
                  title={
                    search
                      ? 'Nenhuma unidade encontrada'
                      : 'Nenhuma unidade cadastrada'
                  }
                  description={
                    search
                      ? 'Ajuste a busca e tente novamente.'
                      : 'Cadastre a primeira unidade no formulário ao lado.'
                  }
                />
              ) : (
                <>
                   <div className="overflow-x-auto rounded-xl border border-border bg-card">
                     <table className="w-full min-w-[680px] text-left text-sm" aria-label="Unidades da caverna">
                       <thead className="border-b border-border bg-accent/40 text-xs uppercase text-muted-foreground">
                         <tr>
                           <th scope="col" className="px-4 py-3">Unidade</th>
                           <th scope="col" className="px-4 py-3">Endereço</th>
                           <th scope="col" className="px-4 py-3">Situação</th>
                           <th scope="col" className="px-4 py-3">Ações</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border">
                         {unitPage?.items.map((unit) => (
                           <tr key={unit.id}>
                             {editingUnitId === unit.id ? (
                               <td colSpan={4} className="p-4">
                                 <UnitForm
                                   caveId={caveId}
                                   unit={unit}
                                   onDone={() => setEditingUnitId(null)}
                                 />
                               </td>
                             ) : (
                               <>
                                 <td className="px-4 py-3 font-semibold">{unit.name}</td>
                                 <td className="px-4 py-3 text-muted-foreground">
                                   <span className="block">{[unit.address, unit.neighborhood].filter(Boolean).join(' · ') || 'Endereço não informado'}</span>
                                   <span className="text-xs">Localização: {unitLocation(unit)}</span>
                                 </td>
                                 <td className="px-4 py-3">
                                   <span className={unit.active ? 'text-primary' : 'text-muted-foreground'}>
                                     {unit.active ? 'Ativa' : 'Arquivada'}
                                   </span>
                                 </td>
                                 <td className="px-4 py-3">
                                   <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUnitId(unit.id)}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                                Editar
                              </Button>
                              {unit.active ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  disabled={mutations.archive.isPending}
                                  onClick={() => void archive(unit)}
                                >
                                  <Trash2
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Arquivar
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={mutations.reactivate.isPending}
                                  onClick={() => void reactivate(unit)}
                                >
                                  <RotateCcw
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Reativar
                                </Button>
                              )}
                                   </div>
                                 </td>
                               </>
                             )}
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                  <nav
                    className="mt-4 flex items-center justify-between gap-3"
                    aria-label="Paginação de unidades"
                  >
                    <p className="text-sm text-muted-foreground">
                      Página {units.data?.page ?? page} de {totalPages} ·{' '}
                      {units.data?.total ?? 0} unidade(s)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((value) => value - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((value) => Math.min(value + 1, totalPages))
                        }
                      >
                        Próxima
                      </Button>
                    </div>
                  </nav>
                </>
              )}
            </div>
          </section>

          <section aria-labelledby="create-unit-title">
            <h2 id="create-unit-title" className="mb-3 text-lg font-semibold">
              Cadastrar unidade
            </h2>
            <UnitForm caveId={caveId} onDone={() => navigate(routes.units)} />
          </section>
        </div>
      )}
    </ManagementShell>
  )
}
