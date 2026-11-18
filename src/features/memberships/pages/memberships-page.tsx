import { Trash2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { canOpenRoute, routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { useAllManagedCaveUnits } from '@/features/academies/hooks/use-academies'
import { usePlatformCaves } from '@/features/platform/hooks/use-platform-caves'
import {
  useStudentMembershipMutations,
  useStudentMemberships,
} from '@/features/memberships/hooks/use-memberships'
import { PractitionerPicker } from '@/features/practitioners/components/practitioner-picker'
import { usePractitionerList } from '@/features/practitioners/hooks/use-practitioners'
import type { Practitioner } from '@/features/practitioners/schemas/practitioner.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'
import { getErrorMessage } from '@/shared/lib/error-message'

function AllStudentsList({ caveId }: { caveId?: string }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())
  const students = usePractitionerList({
    page,
    search: debouncedSearch || undefined,
    caveId,
  })

  return (
    <section className="grid gap-3" aria-label="Todos os alunos">
      <Input
        type="search"
        placeholder="Buscar por nome ou e-mail"
        aria-label="Buscar aluno"
        maxLength={100}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
        className="max-w-xl"
      />
      {students.isPending ? (
        <LoadingState label="Carregando alunos…" />
      ) : students.isError ? (
        <ErrorState
          message={getErrorMessage(
            students.error,
            'Não foi possível carregar os alunos.',
          )}
          onRetry={() => void students.refetch()}
        />
      ) : students.data.items.length === 0 ? (
        <EmptyState
          title="Nenhum aluno encontrado"
          description={
            debouncedSearch
              ? 'Nenhum aluno corresponde à busca.'
              : 'Ainda não há alunos neste escopo.'
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {students.data.total} aluno(s)
          </p>
          <ul
            className="divide-y divide-border rounded-xl border border-border bg-card"
            aria-label="Lista de alunos"
          >
            {students.data.items.map((student) => (
              <li
                key={student.id}
                className="grid gap-2 p-4 text-sm md:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1.5fr)] md:items-center"
              >
                <div>
                  <p className="font-medium">{student.user.name}</p>
                  <p className="text-muted-foreground">{student.user.email}</p>
                </div>
                <span>{student.currentBelt?.name ?? 'Sem faixa'}</span>
                <span className="text-muted-foreground">
                  {student.units.length
                    ? student.units
                        .map((unit) =>
                          caveId || !unit.caveName
                            ? unit.name
                            : `${unit.caveName} · ${unit.name}`,
                        )
                        .join(', ')
                    : 'Sem unidade'}
                </span>
              </li>
            ))}
          </ul>
          {students.data.totalPages > 1 ? (
            <nav
              className="flex items-center justify-end gap-3 text-sm"
              aria-label="Paginação de alunos"
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
                Página {students.data.page} de {students.data.totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= students.data.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Próxima
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  )
}

function StudentLinkForm({ caveUnitId }: { caveUnitId: string }) {
  const mutations = useStudentMembershipMutations()
  async function link(practitioner: Practitioner) {
    try {
      await mutations.link.mutateAsync({
        practitionerId: practitioner.id,
        caveUnitId,
      })
      notify.success(`${practitioner.user.name} vinculado à unidade.`)
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível vincular o aluno.'))
    }
  }
  return (
    <section className="grid gap-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Vincular aluno</h2>
      <PractitionerPicker
        actionLabel="Vincular"
        disabled={mutations.link.isPending}
        onSelect={(practitioner) => void link(practitioner)}
      />
    </section>
  )
}

function StudentList({
  caveUnitId,
  canValidateBelt,
}: {
  caveUnitId: string
  /** Only contexts that may open the evaluations page get the shortcut. */
  canValidateBelt: boolean
}) {
  const students = useStudentMemberships(caveUnitId)
  const mutations = useStudentMembershipMutations()
  async function unlink(practitionerId: string, name: string) {
    if (!window.confirm(`Desvincular ${name} desta unidade?`)) return
    try {
      await mutations.unlink.mutateAsync({ practitionerId, caveUnitId })
      notify.success('Aluno desvinculado da unidade.')
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível desvincular o aluno.'),
      )
    }
  }
  if (students.isPending) return <LoadingState label="Carregando alunos…" />
  if (students.isError)
    return (
      <ErrorState
        message={getErrorMessage(
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
          {canValidateBelt ? (
            <Button asChild type="button" size="sm" variant="outline">
              <Link to={routes.evaluations}>Validar faixa</Link>
            </Button>
          ) : null}
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

  // Platform starts with every cave ('' = no filter); cave admins are pinned.
  const caveId = isPlatformContext
    ? (caves.data?.find((cave) => cave.id === selectedCaveId)?.id ?? '')
    : selectedContext?.role === 'academy'
      ? (selectedContext.caveId ?? '')
      : ''
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
        description="Todos os alunos do seu escopo. Filtre por caverna ou escolha uma unidade para gerenciar as matrículas dela."
      />

      {isPlatformContext ? (
        caves.isPending ? (
          <LoadingState label="Carregando cavernas…" />
        ) : caves.isError ? (
          <ErrorState
            message={getErrorMessage(
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
              <option value="">Todas as cavernas</option>
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
                message={getErrorMessage(
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
                  <option value="">Todas as unidades</option>
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
                <StudentList
                  caveUnitId={selectedUnit.id}
                  canValidateBelt={canOpenRoute(
                    'evaluations',
                    selectedContext?.role,
                  )}
                />
              </div>
              <div className="flex flex-col gap-4">
                <StudentLinkForm caveUnitId={selectedUnit.id} />
                <Link
                  to={routes.practitionersCreate}
                  className="inline-flex items-center gap-2"
                >
                  <UserPlus className="size-4" aria-hidden="true" />
                  Cadastrar novo aluno
                </Link>
              </div>
            </section>
          )}
        </>
      )}

      {!selectedUnit && (isPlatformContext || caveId) ? (
        <div className="mt-6">
          <AllStudentsList key={caveId} caveId={caveId || undefined} />
        </div>
      ) : null}
    </ManagementShell>
  )
}
