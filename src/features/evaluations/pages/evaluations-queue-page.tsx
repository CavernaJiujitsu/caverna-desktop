import { CalendarDays, ClipboardCheck } from 'lucide-react'
import { useState } from 'react'
import { useEvaluations } from '@/features/evaluations/hooks/use-evaluations'
import { getLocalDateInputValue } from '@/features/evaluations/services/evaluation.service'
import { useTeachers } from '@/features/teachers/hooks/use-teachers'
import { ManagementShell } from '@/features/management/components/management-shell'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Input } from '@/shared/components/ui/input'

export default function EvaluationsQueuePage() {
  const [filters, setFilters] = useState({ date: getLocalDateInputValue(), teacherId: '' })
  const query = useEvaluations(filters)
  const teachers = useTeachers()

  return <ManagementShell><div className="mx-auto max-w-6xl">
    <header><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Avaliações</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Fila de graduação</h1><p className="mt-2 max-w-2xl text-muted-foreground">Consulte as avaliações da API por data e professor responsável.</p></header>
    <section className="mt-8 rounded-xl border border-border bg-card p-4" aria-label="Filtros da fila"><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Data local<Input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} /></label><label className="grid gap-2 text-sm font-medium">Professor<select className="h-10 rounded-md border border-input bg-background px-3" disabled={teachers.isLoading || teachers.isError} value={filters.teacherId} onChange={(event) => setFilters((current) => ({ ...current, teacherId: event.target.value }))}><option value="">Todos os professores</option>{teachers.data?.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>{teachers.isLoading ? <span className="text-xs text-muted-foreground">Carregando professores…</span> : teachers.isError ? <span className="text-xs text-destructive">Não foi possível carregar professores.</span> : null}</label></div></section>
    <section className="mt-6" aria-labelledby="evaluation-list-title"><div className="mb-3 flex items-center justify-between"><h2 id="evaluation-list-title" className="text-lg font-semibold">Avaliações encontradas</h2><span className="text-sm text-muted-foreground">{query.data?.length ?? 0} avaliação(ões)</span></div>{query.isLoading ? <LoadingState label="Carregando avaliações…" /> : query.isError ? <ErrorState message="Não foi possível carregar a fila." onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title="Nenhuma avaliação encontrada" description="Ajuste a data ou o professor para consultar outra fila." /> : <div className="grid gap-3">{query.data.map((item) => { const classStart = item.class?.startsAt ?? item.scheduledAt ?? item.createdAt; const status = item.status === 'SCHEDULED' ? 'Agendada' : item.status === 'APPROVED' ? 'Aprovada' : item.status === 'REJECTED' ? 'Rejeitada' : 'Pendente'; return <article key={item.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{classStart ? new Date(classStart).toLocaleString('pt-BR') : 'Data não informada'} · {item.class?.caveUnit?.name ?? 'Unidade não informada'}</div><h3 className="mt-2 text-xl font-semibold">{item.practitioner?.user?.name ?? 'Aluno não informado'}</h3><p className="mt-1 text-sm text-muted-foreground">{item.targetBelt?.name ?? 'Faixa não informada'} · Prof. {item.teacher?.user?.name ?? item.teacher?.id ?? 'Professor não informado'}</p></div><span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold"><ClipboardCheck className="size-3" aria-hidden="true" />{status}</span></div></article> })}</div>}</section>
  </div></ManagementShell>
}
