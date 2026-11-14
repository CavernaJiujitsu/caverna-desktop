import { LoaderCircle, Search, Trash2, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ManagementShell } from '@/features/management/components/management-shell'
import {
  useAllPlatformUsers,
  usePlatformUser,
  usePlatformUsers,
  useRemovePlatformUser,
} from '@/features/platform/hooks/use-platform-users'
import {
  PLATFORM_USERS_MAX_PAGE_SIZE,
  type PlatformUser,
  type PlatformUsersFilter,
} from '@/features/platform/schemas/user.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'
import { USER_ROLES, type UserRole } from '@/shared/types/user-role'

const PAGE_SIZE_OPTIONS = [10, 25, 50, PLATFORM_USERS_MAX_PAGE_SIZE] as const
const ALL_PAGE_SIZE = 'all' as const
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number] | typeof ALL_PAGE_SIZE

const selectClassName =
  'h-9 rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30'

const roleLabel: Record<UserRole, string> = {
  STUDENT: 'Aluno',
  TEACHER: 'Professor',
  CAVE_ADMIN: 'Gestor de caverna',
  ADMIN: 'Administrador',
}

const roleOptions = USER_ROLES.map((role) => ({
  value: role,
  label: roleLabel[role],
}))

function parsePageSize(value: string): PageSize {
  if (value === ALL_PAGE_SIZE) return ALL_PAGE_SIZE
  const parsed = Number(value)
  return PAGE_SIZE_OPTIONS.find((size) => size === parsed) ?? 10
}

function messageForLoadError(error: unknown): string {
  if (error instanceof AppError && error.kind === 'forbidden')
    return 'Somente administradores da plataforma podem consultar usuários.'
  return 'Não foi possível carregar os usuários.'
}

function messageForDeleteError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.kind === 'forbidden')
      return 'Somente administradores da plataforma podem remover usuários.'
    if (error.kind === 'not-found') return 'Usuário não encontrado.'
    if (error.kind === 'unknown' && error.status === 409)
      return 'Este usuário ainda possui vínculos e não pode ser removido agora.'
    if (error.kind === 'network' || error.kind === 'timeout')
      return 'Não foi possível falar com o servidor. Tente novamente.'
  }
  return 'Não foi possível remover o usuário.'
}

function formatDate(value?: string): string {
  if (!value) return 'Não informado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function DeleteUserPanel({
  user,
  onDeleted,
}: {
  user: PlatformUser
  onDeleted: () => void
}) {
  const removeUser = useRemovePlatformUser()
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const confirmed = confirmation === user.email

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!confirmed) return
    setError(null)
    try {
      await removeUser.mutateAsync(user.id)
      notify.success('Usuário removido.')
      onDeleted()
    } catch (mutationError) {
      setError(messageForDeleteError(mutationError))
    }
  }

  return (
    <form
      className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      <h3 className="text-sm font-semibold text-destructive">
        Remover definitivamente
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta ação remove a conta e os vínculos em cascata. Digite o e-mail exato{' '}
        <strong>{user.email}</strong> para confirmar.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="grid flex-1 gap-2 text-sm font-medium">
          Confirmação
          <Input
            value={confirmation}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        <Button
          type="submit"
          variant="destructive"
          disabled={!confirmed || removeUser.isPending}
        >
          {removeUser.isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
          Remover usuário
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}

function UserDetail({
  userId,
  onClose,
  onDeleted,
}: {
  userId: string
  onClose: () => void
  onDeleted: () => void
}) {
  const user = usePlatformUser(userId)

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      aria-labelledby="user-detail-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="user-detail-title" className="text-lg font-semibold">
          Detalhes do usuário
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
      {user.isPending ? (
        <LoadingState label="Carregando usuário…" />
      ) : user.isError ? (
        <ErrorState
          message={messageForLoadError(user.error)}
          onRetry={() => void user.refetch()}
          retryLabel="Tentar novamente"
        />
      ) : (
        <div className="mt-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="font-medium">{user.data.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="font-medium">{user.data.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Perfil</dt>
              <dd className="font-medium">{roleLabel[user.data.role]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Criado em</dt>
              <dd className="font-medium">{formatDate(user.data.createdAt)}</dd>
            </div>
          </dl>
          <DeleteUserPanel user={user.data} onDeleted={onDeleted} />
        </div>
      )}
    </section>
  )
}

export default function PlatformUsersPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filters: PlatformUsersFilter = {
    ...(search ? { search } : {}),
    ...(role ? { role } : {}),
  }
  const isAll = pageSize === ALL_PAGE_SIZE
  const users = usePlatformUsers(
    {
      page,
      limit:
        pageSize === ALL_PAGE_SIZE ? PLATFORM_USERS_MAX_PAGE_SIZE : pageSize,
      ...filters,
    },
    { enabled: pageSize !== ALL_PAGE_SIZE },
  )
  const allUsers = useAllPlatformUsers(filters, { enabled: isAll })
  const activeUsers = isAll ? allUsers : users

  const data = activeUsers.data
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(data?.totalPage ?? 1, 1)
  const currentPage = isAll ? 1 : page
  const currentPageSize = isAll ? total : pageSize
  const firstItem = total === 0 ? 0 : (currentPage - 1) * currentPageSize + 1
  const lastItem = total === 0 ? 0 : firstItem + items.length - 1
  const hasFilters = Boolean(search || searchInput.trim() || role)
  const hasActiveFilter = Boolean(search || role)

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSelectedId(null)
    setSearch(searchInput.trim())
  }

  function applyRole(value: string) {
    setRole(USER_ROLES.find((item) => item === value) ?? '')
    setPage(1)
    setSelectedId(null)
  }

  function applyPageSize(value: string) {
    setPageSize(parsePageSize(value))
    setPage(1)
    setSelectedId(null)
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setRole('')
    setPage(1)
    setSelectedId(null)
  }

  return (
    <ManagementShell>
      <PageHeader
        title="Usuários"
        description="Contas da plataforma, com busca, filtros e remoção protegida."
      />

      <section
        className="mt-6 rounded-xl border border-border bg-card p-4"
        aria-labelledby="users-filters-title"
      >
        <h2 id="users-filters-title" className="text-lg font-semibold">
          Filtros
        </h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={applySearch}
          role="search"
        >
          <label className="grid min-w-60 flex-1 gap-2 text-sm font-medium">
            Buscar por nome ou e-mail
            <Input
              value={searchInput}
              type="search"
              placeholder="Ex.: maria@caverna.app"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Perfil
            <select
              className={selectClassName}
              value={role}
              onChange={(event) => applyRole(event.target.value)}
            >
              <option value="">Todos os perfis</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Itens por página
            <select
              className={selectClassName}
              value={pageSize}
              onChange={(event) => applyPageSize(event.target.value)}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value={ALL_PAGE_SIZE}>Todos</option>
            </select>
          </label>
          <Button type="submit">
            <Search className="size-4" aria-hidden="true" />
            Buscar
          </Button>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </form>
      </section>

      {selectedId && (
        <div className="mt-6">
          <UserDetail
            userId={selectedId}
            onClose={() => setSelectedId(null)}
            onDeleted={() => {
              setSelectedId(null)
              if (items.length <= 1 && page > 1)
                setPage((current) => Math.max(current - 1, 1))
            }}
          />
        </div>
      )}

      <section className="mt-8" aria-labelledby="users-list-title">
        <h2 id="users-list-title" className="sr-only">
          Lista de usuários
        </h2>
        {items.length > 0 && (
          <p aria-live="polite" className="mb-3 text-sm text-muted-foreground">
            Mostrando {firstItem}–{lastItem} de {total} usuário(s)
          </p>
        )}
        {activeUsers.isPending ? (
          <LoadingState label="Carregando usuários…" />
        ) : activeUsers.isError ? (
          <ErrorState
            message={messageForLoadError(activeUsers.error)}
            onRetry={() => void activeUsers.refetch()}
            retryLabel="Tentar novamente"
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={
              hasActiveFilter
                ? 'Nenhum usuário encontrado'
                : 'Nenhum usuário ainda'
            }
            description={
              hasActiveFilter
                ? 'Ajuste a busca ou o perfil para encontrar outra conta.'
                : 'As contas criadas na plataforma aparecerão aqui.'
            }
          />
        ) : (
          <>
            <ul
              className="divide-y divide-border rounded-xl border border-border bg-card"
              aria-label="Usuários da plataforma"
            >
              {items.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="flex items-center gap-3">
                    <UserRound
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email} · {roleLabel[user.role]}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedId(user.id)}
                  >
                    Ver detalhes
                  </Button>
                </li>
              ))}
            </ul>
            {isAll ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Todos os {total} usuário(s) filtrados foram carregados.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                  Página {currentPage} de {totalPages} · {total} usuário(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(1)}
                  >
                    Primeira
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(current - 1, 1))
                    }
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(current + 1, totalPages))
                    }
                  >
                    Próxima
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(totalPages)}
                  >
                    Última
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </ManagementShell>
  )
}
