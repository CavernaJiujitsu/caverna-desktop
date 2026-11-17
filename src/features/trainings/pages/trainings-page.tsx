import { ChevronDown, ChevronRight, Dumbbell, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { canOpenRoute, routes } from '@/app/router/routes'
import { useAllManagedCaveUnits } from '@/features/academies/hooks/use-academies'
import {
  CLASS_TYPE_LABELS,
  TEACHER_NAME_FALLBACK,
} from '@/features/classes/schemas/class.schema'
import {
  addDays,
  endOfDayIso,
  formatClassDate,
  formatTime,
  startOfDayIso,
  toDateInputValue,
} from '@/features/classes/services/class-dates'
import { ManagementShell } from '@/features/management/components/management-shell'
import { usePlatformCaves } from '@/features/platform/hooks/use-platform-caves'
import { TrainingRoster } from '@/features/trainings/components/training-roster'
import { useTrainings } from '@/features/trainings/hooks/use-trainings'
import {
  MAX_PERIOD_DAYS,
  resolvePeriod,
  type TrainingItem,
} from '@/features/trainings/schemas/training.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { useSession } from '@/shared/session/session'

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm'

function formatDateInput(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

function TrainingRow({
  item,
  canManageClass,
}: {
  item: TrainingItem
  /** Only contexts that may open the classes page get the shortcut. */
  canManageClass: boolean
}) {
  const [open, setOpen] = useState(false)
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <li className="rounded-xl border border-border bg-card">
      <button
        type="button"
        className="grid w-full gap-2 p-4 text-left text-sm md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_7rem_9rem_auto] md:items-center"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          <span className="block font-semibold capitalize">
            {formatClassDate(item.startsAt)}
          </span>
          <span className="text-muted-foreground">
            {formatTime(item.startsAt)}–{formatTime(item.endsAt)}
          </span>
        </span>
        <span>
          <span className="block font-medium">{item.caveUnitName}</span>
          <span className="text-muted-foreground">{item.caveName ?? '—'}</span>
        </span>
        <span>{item.teacherName ?? TEACHER_NAME_FALLBACK}</span>
        <span>{CLASS_TYPE_LABELS[item.type]}</span>
        <span>
          <span className="block font-medium">
            {item.enrolledCount}/{item.capacity} alunos
          </span>
          <span className="text-muted-foreground">
            {item.presentCount} presentes
          </span>
        </span>
        <Chevron className="size-4 justify-self-end" aria-hidden="true" />
      </button>
      {open ? (
        <div className="border-t border-border">
          <TrainingRoster classId={item.id} />
          {canManageClass ? (
            <div className="flex justify-end border-t border-border p-3">
              <Button asChild size="sm" variant="outline">
                <Link to={`${routes.classes}?classId=${item.id}`}>
                  <Settings2 className="size-4" aria-hidden="true" />
                  Gerenciar aula
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export default function TrainingsPage() {
  const { selectedContext } = useSession()
  const isPlatform = selectedContext?.role === 'platform'
  const caves = usePlatformCaves({ enabled: isPlatform })
  const [selectedCaveId, setSelectedCaveId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [fromDate, setFromDate] = useState(() => toDateInputValue(new Date()))
  const [toDate, setToDate] = useState(() =>
    toDateInputValue(addDays(new Date(), 7)),
  )
  const [page, setPage] = useState(1)

  // Cave admins are pinned to their own cave (FRD RN-003).
  const caveId = isPlatform ? selectedCaveId : (selectedContext?.caveId ?? '')
  const units = useAllManagedCaveUnits(caveId)
  const period = resolvePeriod(fromDate, toDate)
  const periodError = period.valid ? null : period.error
  const scopeReady = isPlatform || Boolean(caveId)
  const canManageClass = canOpenRoute('classes', selectedContext?.role)

  const trainings = useTrainings(
    {
      page,
      caveId: caveId || undefined,
      caveUnitId: unitId || undefined,
      from: period.valid ? startOfDayIso(period.fromDate) : '',
      to: period.valid ? endOfDayIso(period.toDate) : '',
    },
    scopeReady && period.valid,
  )

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }
  const changeCave = resetPage((value: string) => {
    setSelectedCaveId(value)
    setUnitId('')
  })

  return (
    <ManagementShell>
      <PageHeader
        title="Treinos"
        description="Treinos (aulas) da rede: quando acontecem, onde, com quem e quantos alunos estão inscritos e presentes."
      />

      <section
        className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4"
        aria-label="Filtros de treinos"
      >
        {isPlatform ? (
          <label className="grid gap-1 text-sm font-medium">
            Caverna
            <select
              className={selectClassName}
              value={selectedCaveId}
              onChange={(event) => changeCave(event.target.value)}
              disabled={!caves.isSuccess}
            >
              <option value="">Todas as cavernas</option>
              {caves.data?.map((cave) => (
                <option key={cave.id} value={cave.id}>
                  {cave.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-1 text-sm font-medium">
          Unidade
          <select
            className={selectClassName}
            value={unitId}
            onChange={(event) => resetPage(setUnitId)(event.target.value)}
            disabled={!caveId || !units.isSuccess}
          >
            <option value="">Todas as unidades</option>
            {units.data
              ?.filter((unit) => unit.active)
              .map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          De
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => resetPage(setFromDate)(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Até
          <Input
            type="date"
            value={toDate}
            onChange={(event) => resetPage(setToDate)(event.target.value)}
          />
        </label>
        {periodError ? (
          <p className="text-sm text-destructive md:col-span-4" role="alert">
            {periodError}
          </p>
        ) : null}
        {period.valid && period.limited ? (
          <p
            className="rounded-md border border-border bg-accent px-3 py-2 text-sm text-accent-foreground md:col-span-4"
            role="status"
          >
            O período máximo é de {MAX_PERIOD_DAYS} dias. A data final foi
            limitada a {formatDateInput(period.toDate)}.
          </p>
        ) : null}
      </section>

      {!scopeReady ? (
        <ErrorState message="O contexto selecionado não informa uma caverna válida." />
      ) : periodError ? null : trainings.isPending ? (
        <LoadingState label="Carregando treinos…" />
      ) : trainings.isError ? (
        <ErrorState
          message={getErrorMessage(
            trainings.error,
            'Não foi possível carregar os treinos.',
          )}
          onRetry={() => void trainings.refetch()}
          retryLabel="Tentar novamente"
        />
      ) : trainings.data.items.length === 0 ? (
        <EmptyState
          title="Nenhum treino neste período"
          description="Amplie as datas ou troque os filtros para ver outros treinos."
        />
      ) : (
        <>
          <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Dumbbell className="size-4" aria-hidden="true" />
            {trainings.data.total} treino(s) encontrados
          </p>
          <ul className="grid gap-3" aria-label="Treinos">
            {trainings.data.items.map((item) => (
              <TrainingRow
                key={item.id}
                item={item}
                canManageClass={canManageClass}
              />
            ))}
          </ul>
          {trainings.data.totalPages > 1 ? (
            <nav
              className="mt-4 flex items-center justify-end gap-3 text-sm"
              aria-label="Paginação de treinos"
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
                Página {trainings.data.page} de {trainings.data.totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= trainings.data.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Próxima
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </ManagementShell>
  )
}
