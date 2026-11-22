import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  LockKeyhole,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { ManagementShell } from '@/features/management/components/management-shell'
import { Button } from '@/shared/components/ui/button'
import { catalogService, type Catalog } from '../services/catalog.service'

type Belt = Catalog['belts'][number]
type Stage = NonNullable<Catalog['trails'][number]['stages']>[number]
type Association = NonNullable<Stage['movements']>[number]
type Movement = Catalog['movements'][number]

type Editor =
  | { kind: 'belt'; belt?: Belt }
  | { kind: 'stage'; belt: Belt; stage?: Stage; position: number }
  | { kind: 'movement'; movement?: Movement }
  | {
      kind: 'association'
      stage: Stage
      association?: Association
      position: number
    }

const fieldClass =
  'min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'
const captionClass = 'mb-1.5 block text-xs font-medium text-muted-foreground'
const cardClass = 'rounded-xl border border-border bg-card'

const namedColors: Record<string, string> = {
  WHITE: '#f5f5f4',
  BLUE: '#3585ed',
  PURPLE: '#9248ad',
  BROWN: '#95643d',
  BLACK: '#17181d',
}

function beltColor(color: string) {
  return (
    namedColors[color.toUpperCase()] ??
    (color.startsWith('#') ? color : '#8b8f9b')
  )
}

function initials(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase('pt-BR')
}

function nextPosition(items: { position: number }[]) {
  return Math.max(0, ...items.map((item) => item.position)) + 1
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  min,
  required = true,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string | number
  type?: string
  min?: number
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block min-w-0">
      <span className={captionClass}>{label}</span>
      <input
        className={fieldClass}
        name={name}
        type={type}
        min={min}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
      />
    </label>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  )
}

function EditorDialog({
  editor,
  catalog,
  busy,
  onClose,
  onSubmit,
}: {
  editor: Editor
  catalog: Catalog
  busy: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const firstField = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    firstField.current?.focus()
  }, [editor])

  const title =
    editor.kind === 'belt'
      ? editor.belt
        ? `Editar faixa ${editor.belt.name}`
        : 'Nova faixa'
      : editor.kind === 'stage'
        ? editor.stage
          ? `Editar etapa ${editor.stage.name}`
          : `Nova etapa em ${editor.belt.name}`
        : editor.kind === 'movement'
          ? editor.movement
            ? `Editar ${editor.movement.name}`
            : 'Novo movimento'
          : editor.association
            ? `Editar ${editor.association.movement.name}`
            : `Associar movimento a ${editor.stage.name}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-editor-title"
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
              Catálogo global
            </p>
            <h2 id="catalog-editor-title" className="text-xl font-semibold">
              {title}
            </h2>
          </div>
          <IconButton label="Fechar editor" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </IconButton>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          {editor.kind === 'belt' && (
            <>
              <div
                ref={(node) => {
                  firstField.current = node?.querySelector('input') ?? null
                }}
              >
                <Field
                  label="Nome da faixa"
                  name="name"
                  defaultValue={editor.belt?.name}
                  placeholder="Ex.: Azul"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Cor (nome ou hexadecimal)"
                  name="color"
                  defaultValue={editor.belt?.color}
                  placeholder="BLUE ou #3585ed"
                />
                <Field
                  label="Nível"
                  name="level"
                  type="number"
                  min={1}
                  defaultValue={editor.belt?.level}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Minutos mínimos"
                  name="minutes"
                  type="number"
                  min={0}
                  defaultValue={editor.belt?.minimumTrainingMinutes ?? 0}
                />
                <Field
                  label="Aulas mínimas"
                  name="classes"
                  type="number"
                  min={0}
                  defaultValue={editor.belt?.minimumTrainingClasses ?? 0}
                />
              </div>
            </>
          )}
          {editor.kind === 'stage' && (
            <>
              <div
                ref={(node) => {
                  firstField.current = node?.querySelector('input') ?? null
                }}
              >
                <Field
                  label="Nome da etapa"
                  name="name"
                  defaultValue={editor.stage?.name}
                  placeholder="Ex.: Fundamentos"
                />
              </div>
              <Field
                label="Ordem da etapa"
                name="position"
                type="number"
                min={1}
                defaultValue={editor.stage?.position ?? editor.position}
              />
            </>
          )}
          {editor.kind === 'movement' && (
            <>
              <div
                ref={(node) => {
                  firstField.current = node?.querySelector('input') ?? null
                }}
              >
                <Field
                  label="Nome do movimento"
                  name="name"
                  defaultValue={editor.movement?.name}
                  placeholder="Ex.: Armlock"
                />
              </div>
              <Field
                label="Descrição"
                name="description"
                defaultValue={editor.movement?.description ?? ''}
                required={false}
                placeholder="Uma breve descrição"
              />
            </>
          )}
          {editor.kind === 'association' && (
            <>
              {editor.association ? (
                <p className="rounded-lg border border-border bg-background p-3 text-sm">
                  {editor.association.movement.name}
                </p>
              ) : (
                <label className="block">
                  <span className={captionClass}>Movimento para a etapa</span>
                  <select
                    name="movementId"
                    className={fieldClass}
                    required
                    defaultValue=""
                  >
                    <option value="">Selecione um movimento</option>
                    {catalog.movements
                      .filter(
                        (movement) =>
                          !(editor.stage.movements ?? []).some(
                            (link) => link.movement.id === movement.id,
                          ),
                      )
                      .map((movement) => (
                        <option key={movement.id} value={movement.id}>
                          {movement.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <div
                ref={(node) => {
                  firstField.current = node?.querySelector('input') ?? null
                }}
              >
                <Field
                  label="Ordem do movimento"
                  name="position"
                  type="number"
                  min={1}
                  defaultValue={editor.association?.position ?? editor.position}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="required"
                  type="checkbox"
                  defaultChecked={editor.association?.required ?? true}
                  className="size-4 accent-primary"
                />
                Obrigatório para graduar
              </label>
            </>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy
                ? 'Salvando…'
                : editor.kind === 'association' && !editor.association
                  ? 'Associar movimento'
                  : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['graduation-catalog'],
    queryFn: catalogService.list,
  })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [expandedBelts, setExpandedBelts] = useState<string[]>([])
  const [expandedStages, setExpandedStages] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [minimum, setMinimum] = useState<number | null>(null)
  const initialized = useRef(false)
  const catalog = query.data

  useEffect(() => {
    if (catalog && !initialized.current) {
      initialized.current = true
      setExpandedBelts(catalog.belts[0] ? [catalog.belts[0].id] : [])
      const firstTrail = catalog.trails.find(
        (trail) => trail.belt.id === catalog.belts[0]?.id,
      )
      setExpandedStages(
        firstTrail?.stages?.[0] ? [firstTrail.stages[0].id] : [],
      )
    }
  }, [catalog])

  const visibleMinimum = minimum ?? catalog?.minimumPracticeClasses ?? 1

  async function save(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      await action()
      await queryClient.invalidateQueries({ queryKey: ['graduation-catalog'] })
      setSaved(true)
      setEditor(null)
    } catch {
      setError('Não foi possível salvar. Confira os dados e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  function saveEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor) return
    const values = new FormData(event.currentTarget)
    const text = (name: string) => String(values.get(name) ?? '').trim()
    const number = (name: string) => Number(values.get(name))
    const active = editor
    void save(async () => {
      if (active.kind === 'belt') {
        await catalogService.saveBelt(
          {
            name: text('name'),
            color: text('color'),
            level: number('level'),
            minimumTrainingMinutes: number('minutes'),
            minimumTrainingClasses: number('classes'),
          },
          active.belt?.id,
        )
      } else if (active.kind === 'stage') {
        await catalogService.saveStage(
          active.belt.id,
          {
            name: text('name'),
            position: number('position'),
          },
          active.stage?.id,
        )
        setExpandedBelts((current) =>
          current.includes(active.belt.id)
            ? current
            : [...current, active.belt.id],
        )
      } else if (active.kind === 'movement') {
        await catalogService.saveMovement(
          {
            name: text('name'),
            description: text('description'),
          },
          active.movement?.id,
        )
      } else {
        await catalogService.link(active.stage.id, {
          movementId: active.association?.movement.id ?? text('movementId'),
          position: number('position'),
          required: values.get('required') === 'on',
        })
      }
    })
  }

  function toggleBelt(id: string) {
    setExpandedBelts((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  function toggleStage(id: string) {
    setExpandedStages((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const allExpanded = Boolean(
    catalog?.belts.length && expandedBelts.length === catalog.belts.length,
  )
  const filteredMovements =
    catalog?.movements.filter((movement) =>
      movement.name
        .toLocaleLowerCase('pt-BR')
        .includes(search.trim().toLocaleLowerCase('pt-BR')),
    ) ?? []
  const totalStages =
    catalog?.trails.reduce(
      (sum, trail) => sum + (trail.stages?.length ?? 0),
      0,
    ) ?? 0

  return (
    <ManagementShell>
      <div className="mx-auto max-w-[1390px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Administração <span className="mx-1 text-primary">/</span>{' '}
              Catálogo de faixas
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Catálogo de faixas
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <LockKeyhole className="size-3" aria-hidden="true" />
              Compartilhado entre todas as academias. Faixas não podem ser
              excluídas.
            </p>
          </div>
          <Button
            type="button"
            className="min-w-36"
            onClick={() => setEditor({ kind: 'belt' })}
          >
            <Plus className="size-4" aria-hidden="true" /> Nova faixa
          </Button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        {saved && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-card px-4 py-3 text-xs text-emerald-400 shadow-xl"
          >
            <Check className="size-4" aria-hidden="true" /> Alterações salvas
          </div>
        )}
        {query.isLoading && (
          <p className="text-sm text-muted-foreground">Carregando catálogo…</p>
        )}
        {query.isError && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível carregar o catálogo.
          </p>
        )}

        {catalog && (
          <>
            <section
              aria-label="Resumo do catálogo"
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div
                className={`${cardClass} flex min-h-28 flex-col justify-between p-4`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Faixas
                </p>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-2xl font-bold">
                    {catalog.belts.length}
                  </span>
                  <div aria-hidden="true" className="flex -space-x-1">
                    {catalog.belts.slice(0, 6).map((belt) => (
                      <span
                        key={belt.id}
                        className="size-3 rounded-full border border-card"
                        style={{ backgroundColor: beltColor(belt.color) }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">no catálogo</p>
              </div>
              <div
                className={`${cardClass} flex min-h-28 flex-col justify-between p-4`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Etapas
                </p>
                <span className="text-2xl font-bold">{totalStages}</span>
                <p className="text-[11px] text-muted-foreground">
                  em todas as faixas
                </p>
              </div>
              <div
                className={`${cardClass} flex min-h-28 flex-col justify-between p-4`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Movimentos globais
                </p>
                <span className="text-2xl font-bold">
                  {catalog.movements.length}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  reutilizáveis em qualquer etapa
                </p>
              </div>
              <form
                className={`${cardClass} flex min-h-28 flex-col justify-between border-primary/25 p-4`}
                onSubmit={(event) => {
                  event.preventDefault()
                  void save(() => catalogService.setMinimum(visibleMinimum))
                }}
              >
                <label
                  htmlFor="practice-minimum"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Mínimo universal de aulas por movimento
                </label>
                <div className="flex items-center gap-2">
                  <IconButton
                    label="Diminuir mínimo"
                    onClick={() => setMinimum(Math.max(1, visibleMinimum - 1))}
                  >
                    <Minus className="size-4" />
                  </IconButton>
                  <input
                    id="practice-minimum"
                    name="minimum"
                    type="number"
                    min={1}
                    required
                    value={visibleMinimum}
                    onChange={(event) => setMinimum(Number(event.target.value))}
                    className="w-12 bg-transparent text-center text-xl font-bold outline-none"
                  />
                  <IconButton
                    label="Aumentar mínimo"
                    onClick={() => setMinimum(visibleMinimum + 1)}
                  >
                    <Plus className="size-4" />
                  </IconButton>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    por movimento
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={busy || visibleMinimum < 1}
                  className="self-end text-xs font-medium text-teal-400 hover:text-teal-300 disabled:opacity-50"
                >
                  Salvar
                </button>
              </form>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section
                aria-labelledby="belts-heading"
                className="min-w-0 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 id="belts-heading" className="text-base font-semibold">
                    Faixas
                  </h2>
                  <button
                    type="button"
                    className="text-xs font-medium text-teal-400 hover:underline"
                    onClick={() =>
                      setExpandedBelts(
                        allExpanded ? [] : catalog.belts.map((belt) => belt.id),
                      )
                    }
                  >
                    {allExpanded ? 'Recolher tudo' : 'Expandir tudo'}
                  </button>
                </div>
                {catalog.belts.map((belt) => {
                  const trail = catalog.trails.find(
                    (item) => item.belt.id === belt.id,
                  )
                  const stages = [...(trail?.stages ?? [])].sort(
                    (a, b) => a.position - b.position,
                  )
                  const movementCount = stages.reduce(
                    (sum, stage) => sum + (stage.movements?.length ?? 0),
                    0,
                  )
                  const expanded = expandedBelts.includes(belt.id)
                  return (
                    <article
                      key={belt.id}
                      className={`${cardClass} overflow-hidden ${expanded ? 'border-primary/30' : ''}`}
                    >
                      <div className="flex items-center gap-3 p-4">
                        <span
                          className="size-10 shrink-0 rounded-full border border-white/25 shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
                          style={{ backgroundColor: beltColor(belt.color) }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold">
                            {belt.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="rounded bg-secondary px-1.5 py-0.5">
                              Nível {belt.level}
                            </span>
                            <span className="rounded bg-teal-500/10 px-1.5 py-0.5 font-semibold text-teal-400">
                              {belt.color.toUpperCase()}
                            </span>
                            <span>
                              {belt.minimumTrainingMinutes.toLocaleString(
                                'pt-BR',
                              )}{' '}
                              min · {belt.minimumTrainingClasses} aulas mín. ·{' '}
                              {stages.length} etapas · {movementCount}{' '}
                              movimentos
                            </span>
                          </div>
                        </div>
                        <IconButton
                          label={`Editar faixa ${belt.name}`}
                          onClick={() => setEditor({ kind: 'belt', belt })}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </IconButton>
                        <IconButton
                          label={`${expanded ? 'Recolher' : 'Expandir'} faixa ${belt.name}`}
                          onClick={() => toggleBelt(belt.id)}
                        >
                          {expanded ? (
                            <ChevronUp className="size-4" aria-hidden="true" />
                          ) : (
                            <ChevronDown
                              className="size-4"
                              aria-hidden="true"
                            />
                          )}
                        </IconButton>
                      </div>
                      {expanded && (
                        <div className="space-y-3 border-t border-border bg-background/25 px-4 pb-4 pt-3">
                          {stages.map((stage) => {
                            const links = [...(stage.movements ?? [])].sort(
                              (a, b) => a.position - b.position,
                            )
                            const open = expandedStages.includes(stage.id)
                            return (
                              <div
                                key={stage.id}
                                className="rounded-lg border border-border/70 bg-card/70"
                              >
                                <div className="flex items-center gap-2 px-3 py-3">
                                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                    {stage.position}
                                  </span>
                                  <button
                                    type="button"
                                    className="min-w-0 flex-1 text-left text-xs font-semibold hover:text-primary"
                                    onClick={() => toggleStage(stage.id)}
                                    aria-expanded={open}
                                  >
                                    {stage.name}
                                  </button>
                                  <span className="hidden text-[11px] text-muted-foreground sm:inline">
                                    {links.length} movimentos
                                  </span>
                                  <IconButton
                                    label={`Editar etapa ${stage.name}`}
                                    onClick={() =>
                                      setEditor({
                                        kind: 'stage',
                                        belt,
                                        stage,
                                        position: stage.position,
                                      })
                                    }
                                  >
                                    <Pencil
                                      className="size-3.5"
                                      aria-hidden="true"
                                    />
                                  </IconButton>
                                  <IconButton
                                    label={`${open ? 'Recolher' : 'Expandir'} etapa ${stage.name}`}
                                    onClick={() => toggleStage(stage.id)}
                                  >
                                    {open ? (
                                      <ChevronUp className="size-3.5" />
                                    ) : (
                                      <ChevronDown className="size-3.5" />
                                    )}
                                  </IconButton>
                                </div>
                                {open && (
                                  <div className="space-y-1 border-t border-border/60 p-2">
                                    {links.map((link) => (
                                      <button
                                        key={link.id}
                                        type="button"
                                        onClick={() =>
                                          setEditor({
                                            kind: 'association',
                                            stage,
                                            association: link,
                                            position: link.position,
                                          })
                                        }
                                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
                                        aria-label={`Editar associação de ${link.movement.name} na etapa ${stage.name}`}
                                      >
                                        <span className="text-[11px] text-muted-foreground">
                                          ⋮⋮
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                          {link.position}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                          {link.movement.name}
                                        </span>
                                        <span className="hidden max-w-40 truncate text-[11px] text-muted-foreground md:inline">
                                          {link.movement.description}
                                        </span>
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${link.required ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}
                                        >
                                          {link.required
                                            ? 'Obrigatório'
                                            : 'Opcional'}
                                        </span>
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditor({
                                          kind: 'association',
                                          stage,
                                          position: nextPosition(links),
                                        })
                                      }
                                      className="mt-1 w-full rounded-md border border-dashed border-border py-2 text-xs font-semibold text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/5"
                                    >
                                      + Associar movimento
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          <button
                            type="button"
                            onClick={() =>
                              setEditor({
                                kind: 'stage',
                                belt,
                                position: nextPosition(stages),
                              })
                            }
                            className="w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10"
                          >
                            + Nova etapa
                          </button>
                        </div>
                      )}
                    </article>
                  )
                })}
              </section>

              <aside className="space-y-3">
                <section
                  className={`${cardClass} p-4`}
                  aria-labelledby="movements-heading"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h2
                      id="movements-heading"
                      className="text-sm font-semibold"
                    >
                      Movimentos globais
                    </h2>
                    <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400">
                      {catalog.movements.length}
                    </span>
                  </div>
                  <p className="mb-4 text-[11px] text-muted-foreground">
                    Reutilizáveis em qualquer etapa.
                  </p>
                  <label className="relative block">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Buscar movimento</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar movimento..."
                      className={`${fieldClass} pl-9`}
                    />
                  </label>
                  <div className="mt-3 max-h-[370px] space-y-1.5 overflow-y-auto pr-1">
                    {filteredMovements.map((movement) => {
                      const uses = catalog.trails.reduce(
                        (sum, trail) =>
                          sum +
                          (trail.stages ?? []).reduce(
                            (total, stage) =>
                              total +
                              (stage.movements ?? []).filter(
                                (link) => link.movement.id === movement.id,
                              ).length,
                            0,
                          ),
                        0,
                      )
                      return (
                        <div
                          key={movement.id}
                          className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/40 p-2.5"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded bg-teal-500/10 text-xs font-semibold text-teal-400">
                            {initials(movement.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">
                              {movement.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Usado em {uses} {uses === 1 ? 'etapa' : 'etapas'}
                            </p>
                          </div>
                          <IconButton
                            label={`Editar movimento ${movement.name}`}
                            onClick={() =>
                              setEditor({ kind: 'movement', movement })
                            }
                          >
                            <MoreHorizontal
                              className="size-4"
                              aria-hidden="true"
                            />
                          </IconButton>
                        </div>
                      )
                    })}
                    {!filteredMovements.length && (
                      <p className="py-5 text-center text-xs text-muted-foreground">
                        Nenhum movimento encontrado.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditor({ kind: 'movement' })}
                    className="mt-4 w-full rounded-lg border border-dashed border-teal-500/50 py-2.5 text-xs font-semibold text-teal-400 hover:bg-teal-500/5"
                  >
                    + Novo movimento
                  </button>
                </section>
                <section
                  className={`${cardClass} p-4`}
                  aria-labelledby="how-it-works"
                >
                  <h2
                    id="how-it-works"
                    className="mb-3 flex items-center gap-2 text-xs font-semibold"
                  >
                    <CircleHelp
                      className="size-4 text-teal-400"
                      aria-hidden="true"
                    />{' '}
                    Como funciona
                  </h2>
                  <ol className="space-y-3 text-[11px] text-muted-foreground">
                    <li>
                      <span className="mr-2 text-primary">1</span> Faixa define
                      nível e mínimos de treino.
                    </li>
                    <li>
                      <span className="mr-2 text-primary">2</span> Etapa agrupa
                      movimentos em ordem.
                    </li>
                    <li>
                      <span className="mr-2 text-primary">3</span> Obrigatório é
                      exigido para graduar.
                    </li>
                  </ol>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
      {editor && catalog && (
        <EditorDialog
          editor={editor}
          catalog={catalog}
          busy={busy}
          onClose={() => setEditor(null)}
          onSubmit={saveEditor}
        />
      )}
    </ManagementShell>
  )
}
