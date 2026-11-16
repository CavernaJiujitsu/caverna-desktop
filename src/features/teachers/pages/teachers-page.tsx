import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { TeacherCreateForm } from '@/features/teachers/components/teacher-forms'
import { useTeachers } from '@/features/teachers/hooks/use-teachers'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useSession } from '@/shared/session/session'
import { AppError } from '@/shared/types/app-error'
import type { ManagementContext } from '@/shared/types/management-context'

function caveIdFromContext(
  context: ManagementContext | null,
): string | undefined {
  if (context?.role !== 'academy') return undefined
  const [scope, caveId] = context.id.split(':')
  return scope === 'academy' && caveId ? caveId : undefined
}

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

export default function TeachersPage() {
  const { selectedContext } = useSession()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const caveId = caveIdFromContext(selectedContext)
  const teachers = useTeachers({
    page,
    limit: 20,
    ...(search ? { search } : {}),
    ...(caveId ? { caveId } : {}),
  })

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const items = teachers.data?.items ?? []
  const totalPages = Math.max(teachers.data?.totalPage ?? 1, 1)

  return (
    <ManagementShell>
      <PageHeader
        title="Professores"
        description={
          caveId
            ? 'O acesso às aulas é controlado por unidade.'
            : 'Professores de todas as cavernas.'
        }
      />
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0" aria-labelledby="teachers-list-title">
          <form
            className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4"
            onSubmit={submitSearch}
          >
            <label className="sr-only" htmlFor="teacher-search">
              Buscar professores
            </label>
            <Input
              id="teacher-search"
              className="min-w-52 flex-1"
              placeholder="Buscar por nome ou e-mail"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Button type="submit">
              <Search className="size-4" aria-hidden="true" />
              Buscar
            </Button>
          </form>
          <h2 id="teachers-list-title" className="mt-6 text-lg font-semibold">
            Professores cadastrados
          </h2>
          <div className="mt-3">
            {teachers.isPending ? (
              <LoadingState label="Carregando professores…" />
            ) : teachers.isError ? (
              <ErrorState
                message={messageForError(
                  teachers.error,
                  'Não foi possível carregar os professores.',
                )}
                onRetry={() => void teachers.refetch()}
              />
            ) : items.length === 0 ? (
              <EmptyState
                title="Nenhum professor encontrado"
                description="Ajuste a busca ou crie o primeiro professor."
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table
                    className="w-full min-w-[560px] text-left text-sm"
                    aria-label="Professores"
                  >
                    <thead className="bg-accent text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Professor</th>
                        <th className="px-4 py-3 font-medium">E-mail</th>
                        <th className="px-4 py-3 font-medium">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((teacher) => (
                        <tr key={teacher.id}>
                          <td className="px-4 py-3 font-medium">
                            {teacher.name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {teacher.email ?? 'E-mail não informado'}
                          </td>
                          <td className="px-4 py-3">
                            <Button asChild size="sm" variant="link">
                              <Link to={`${routes.teachers}/${teacher.id}`}>
                                Ver professor
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <nav
                  className="mt-4 flex items-center justify-between gap-3"
                  aria-label="Paginação de professores"
                >
                  <p className="text-sm text-muted-foreground">
                    Página {teachers.data?.page ?? page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </nav>
              </>
            )}
          </div>
        </section>
        <TeacherCreateForm caveId={caveId} />
      </div>
    </ManagementShell>
  )
}
