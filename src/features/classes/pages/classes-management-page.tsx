import { useState } from 'react'
import { CalendarDays, ChevronRight, Plus, Users } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { ManagementShell } from '@/features/management/components/management-shell'
import { classInputSchema, type AcademyClass, type ClassInput } from '@/features/classes/schemas/class.schema'
import { useClasses, useSaveClass } from '@/features/classes/hooks/use-classes'
import { useClassCatalog } from '@/features/classes/hooks/use-class-catalog'
import { notify } from '@/shared/lib/notifications'

const today = new Date().toISOString().slice(0, 10)

function labelForType(type: AcademyClass['type']) {
  return { regular: 'Regular', validation: 'Validação', exam: 'Exame' }[type]
}

function ClassForm({ value, onCancel, onSaved }: { value: AcademyClass | null; onCancel: () => void; onSaved: () => void }) {
  const mutation = useSaveClass()
  const catalog = useClassCatalog()
  const units = catalog.units.data ?? []
  const teachers = catalog.teachers.data ?? []
  type FormValues = z.input<typeof classInputSchema>
  const form = useForm<FormValues, unknown, ClassInput>({
    resolver: zodResolver(classInputSchema),
    defaultValues: value ? { unitId: value.unitId, teacherId: value.teacherId, date: value.date, startsAt: value.startsAt, endsAt: value.endsAt, capacity: value.capacity, type: value.type, eligibleBelts: value.eligibleBelts, movementIds: value.movements.map((movement) => movement.id) } : { unitId: units[0]?.id ?? '', teacherId: teachers[0]?.id ?? '', date: today, startsAt: '19:00', endsAt: '20:30', capacity: 20, type: 'regular', eligibleBelts: ['white'], movementIds: [] },
  })
  const selectedBelts = useWatch({ control: form.control, name: 'eligibleBelts' })

  async function submit(input: ClassInput) {
    try { await mutation.mutateAsync({ id: value?.id, input }); notify.success(value ? 'Aula atualizada.' : 'Aula criada.'); onSaved() } catch (error) { notify.error(error instanceof Error ? error.message : 'Não foi possível salvar a aula.') }
  }

  return <section className="rounded-xl border border-border bg-card p-6" aria-labelledby="class-form-title">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">{value ? 'Editar encontro' : 'Novo encontro'}</p><h2 id="class-form-title" className="mt-2 text-2xl font-semibold">{value ? value.unitName : 'Cadastrar aula'}</h2></div><Button type="button" variant="ghost" onClick={onCancel}>Fechar</Button></div>
    <form className="mt-6 grid gap-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">Unidade<select className="h-10 rounded-md border border-input bg-background px-3" {...form.register('unitId')}><option value="">Selecione</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>{form.formState.errors.unitId && <span className="text-xs text-destructive">{form.formState.errors.unitId.message}</span>}</label>
        <label className="grid gap-2 text-sm font-medium">Professor<select className="h-10 rounded-md border border-input bg-background px-3" {...form.register('teacherId')}><option value="">Selecione</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>{form.formState.errors.teacherId && <span className="text-xs text-destructive">{form.formState.errors.teacherId.message}</span>}</label>
        <label className="grid gap-2 text-sm font-medium">Data<Input type="date" {...form.register('date')} />{form.formState.errors.date && <span className="text-xs text-destructive">{form.formState.errors.date.message}</span>}</label>
        <label className="grid gap-2 text-sm font-medium">Tipo<select className="h-10 rounded-md border border-input bg-background px-3" {...form.register('type')}><option value="regular">Regular</option><option value="validation">Validação</option><option value="exam">Exame</option></select></label>
        <label className="grid gap-2 text-sm font-medium">Início<Input type="time" {...form.register('startsAt')} /></label>
        <label className="grid gap-2 text-sm font-medium">Fim<Input type="time" {...form.register('endsAt')} /></label>
        <label className="grid gap-2 text-sm font-medium">Capacidade<Input type="number" min="1" {...form.register('capacity')} />{form.formState.errors.capacity && <span className="text-xs text-destructive">{form.formState.errors.capacity.message}</span>}</label>
      </div>
      <fieldset><legend className="text-sm font-medium">Faixas elegíveis</legend><div className="mt-2 flex flex-wrap gap-2">{(['white','blue','purple','brown','black'] as const).map((belt) => <label key={belt} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><input type="checkbox" checked={selectedBelts.includes(belt)} onChange={(event) => form.setValue('eligibleBelts', event.target.checked ? [...selectedBelts, belt] : selectedBelts.filter((item) => item !== belt), { shouldValidate: true })} />{belt}</label>)}</div>{form.formState.errors.eligibleBelts && <p className="mt-2 text-xs text-destructive">{form.formState.errors.eligibleBelts.message}</p>}</fieldset>
      <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : value ? 'Salvar alterações' : 'Criar aula'}</Button></div>
    </form>
  </section>
}

export default function ClassesManagementPage() {
  const [filters, setFilters] = useState({ unitId: '', date: today })
  const [selected, setSelected] = useState<AcademyClass | null>(null)
  const [editing, setEditing] = useState<AcademyClass | null | undefined>(undefined)
  const query = useClasses(filters)
  const catalog = useClassCatalog()
  const classUnits = catalog.units.data ?? []
  const classes = query.data ?? []
  const selectedFresh = classes.find((item) => item.id === selected?.id) ?? selected

  return <ManagementShell><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Gestão de aulas</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Encontros</h1><p className="mt-2 max-w-2xl text-muted-foreground">Consulte a agenda da unidade, ajuste a capacidade e acompanhe as inscrições de cada encontro.</p></div><Button onClick={() => { setSelected(null); setEditing(null) }}><Plus className="size-4" aria-hidden="true" />Nova aula</Button></header>
    <section className="mt-8 rounded-xl border border-border bg-card p-4" aria-label="Filtros de aulas"><div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"><label className="grid gap-2 text-sm font-medium">Unidade<select className="h-10 rounded-md border border-input bg-background px-3" value={filters.unitId} onChange={(event) => setFilters((current) => ({ ...current, unitId: event.target.value }))}><option value="">Todas as unidades</option>{classUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Data<Input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} /></label><Button className="self-end" variant="outline" onClick={() => setFilters({ unitId: '', date: '' })}>Limpar filtros</Button></div></section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <section aria-labelledby="class-list-title"><div className="mb-3 flex items-center justify-between"><h2 id="class-list-title" className="text-lg font-semibold">Aulas encontradas</h2><span className="text-sm text-muted-foreground">{classes.length} encontro(s)</span></div>{query.isLoading ? <LoadingState label="Carregando encontros…" /> : query.isError ? <ErrorState message="Não foi possível carregar os encontros." onRetry={() => query.refetch()} /> : classes.length === 0 ? <EmptyState title="Nenhum encontro encontrado" description="Ajuste a unidade ou a data para consultar outros encontros." /> : <div className="grid gap-3">{classes.map((item) => <article key={item.id} className={`rounded-xl border bg-card p-5 transition-colors ${selected?.id === item.id ? 'border-primary' : 'border-border'}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{item.date} · {item.startsAt}–{item.endsAt}</div><h3 className="mt-2 text-xl font-semibold">{item.unitName}</h3><p className="mt-1 text-sm text-muted-foreground">{item.teacherName} · {labelForType(item.type)}</p></div><span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold">{item.enrollments.length}/{item.capacity} inscritos</span></div><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => setSelected(item)}><Users className="size-4" aria-hidden="true" />Ver inscritos</Button><Button variant="ghost" size="sm" onClick={() => { setSelected(null); setEditing(item) }}>Editar <ChevronRight className="size-4" aria-hidden="true" /></Button></div></article>)}</div>}</section>
      {editing !== undefined ? <ClassForm value={editing} onCancel={() => setEditing(undefined)} onSaved={() => setEditing(undefined)} /> : selectedFresh ? <section className="rounded-xl border border-border bg-card p-6" aria-labelledby="enrollment-title"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Detalhe do encontro</p><h2 id="enrollment-title" className="mt-2 text-2xl font-semibold">Inscritos</h2><p className="mt-1 text-sm text-muted-foreground">{selectedFresh.date} · {selectedFresh.startsAt}–{selectedFresh.endsAt} · {selectedFresh.unitName}</p></div><Button variant="ghost" onClick={() => setSelected(null)}>Fechar</Button></div><div className="mt-5 rounded-lg bg-accent p-4"><p className="text-sm text-muted-foreground">Lotação atual</p><p className="mt-1 text-2xl font-semibold">{selectedFresh.enrollments.length} <span className="text-base font-normal text-muted-foreground">de {selectedFresh.capacity}</span></p></div>{selectedFresh.enrollments.length === 0 ? <div className="mt-5"><EmptyState title="Nenhum inscrito" description="Este encontro ainda não possui inscrições." /></div> : <ul className="mt-5 divide-y divide-border" aria-label="Lista de inscritos">{selectedFresh.enrollments.map((enrollment) => <li key={enrollment.id} className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">{enrollment.studentName}</p><p className="text-sm text-muted-foreground">{enrollment.belt ?? 'Sem faixa validada'} · {enrollment.status === 'confirmed' ? 'Presença confirmada' : 'Reserva'}</p></div><span className="text-xs text-muted-foreground">{new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}</span></li>)}</ul>}</section> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Selecione um encontro para consultar os inscritos ou crie uma nova aula.</div>}
    </div>
  </div></ManagementShell>
}
