import { Search, UserPlus, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ManagementShell } from '@/features/management/components/management-shell'
import { ManagementUserForm } from '@/features/platform/components/access-forms'
import { RoleBadges } from '@/features/platform/components/role-badges'
import { UserAccessPanel } from '@/features/platform/components/user-access-panel'
import {
  useAllPlatformUsers,
  usePlatformUsers,
} from '@/features/platform/hooks/use-platform-users'
import {
  PLATFORM_USERS_MAX_PAGE_SIZE,
  type PlatformUsersFilter,
} from '@/features/platform/schemas/user.schema'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { useSession } from '@/shared/session/session'
import { AppError } from '@/shared/types/app-error'
import { ROLE_LABELS, type UserRole } from '@/shared/types/user-role'

const PAGE_SIZE_OPTIONS = [10, 25, 50, PLATFORM_USERS_MAX_PAGE_SIZE] as const
const ALL_PAGE_SIZE = 'all' as const
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number] | typeof ALL_PAGE_SIZE

const selectClassName =
  'h-9 rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30'

// role=ADMIN also matches ROOT on the backend, so ROOT is not a filter option.
const FILTER_ROLES: UserRole[] = ['STUDENT', 'TEACHER', 'CAVE_ADMIN', 'ADMIN']

const roleOptions = FILTER_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))

function parsePageSize(value: string): PageSize {
  if (value === ALL_PAGE_SIZE) return ALL_PAGE_SIZE
  const parsed = Number(value)
  return PAGE_SIZE_OPTIONS.find((size) => size === parsed) ?? 10
}

function messageForLoadError(error: unknown): string {
  if (error instanceof AppError && error.kind === 'forbidden')
    return 'Somente administradores da plataforma podem consultar usuários.'
  return getErrorMessage(error, 'Não foi possível carregar os usuários.')
}

export default function PlatformUsersPage() {
  const { session } = useSession()
  const actorIsRoot = session?.roles.includes('ROOT') ?? false
  const [creating, setCreating] = useState(false)
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
    setRole(FILTER_ROLES.find((item) => item === value) ?? '')
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Usuários e acessos"
          description="Consulte contas, conceda ou revogue acessos de gestão e crie usuários de gestão."
        />
        {!creating && (
          <Button
            type="button"
            onClick={() => {
              setCreating(true)
              setSelectedId(null)
            }}
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Novo usuário de gestão
          </Button>
        )}
      </div>

      {creating && (
        <ManagementUserForm
          actorIsRoot={actorIsRoot}
          onCancel={() => setCreating(false)}
          onCreated={(userId) => {
            setCreating(false)
            setSelectedId(userId)
          }}
        />
      )}

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
          <UserAccessPanel
            key={selectedId}
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
                    <div className="grid gap-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <RoleBadges roles={user.roles} />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCreating(false)
                      setSelectedId(user.id)
                    }}
                  >
                    Ver acessos
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
