import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCaveAdminMutations } from '@/features/platform/hooks/use-platform-caves'
import { usePlatformUsers } from '@/features/platform/hooks/use-platform-users'
import {
  createCaveAdminSchema,
  type CaveAdminFormInput,
  type CreateCaveAdminInput,
} from '@/features/platform/schemas/cave.schema'
import type { PlatformUser } from '@/features/platform/schemas/user.schema'
import { RoleBadges } from '@/features/platform/components/role-badges'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { getErrorMessage } from '@/shared/lib/error-message'
import { useSession } from '@/shared/session/session'
import { notify } from '@/shared/lib/notifications'

function messageForAdminError(error: unknown): string {
  return getErrorMessage(
    error,
    'Não foi possível salvar o gestor. Tente novamente.',
  )
}

export function CaveAdminForm({
  caveId,
  onSuccess,
}: {
  caveId: string
  onSuccess?: () => void
}) {
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [searchInput, setSearchInput] = useState('')
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const mutations = useCaveAdminMutations(caveId)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CaveAdminFormInput, unknown, CreateCaveAdminInput>({
    resolver: zodResolver(createCaveAdminSchema),
    defaultValues: { name: '', email: '', password: '', userId: undefined },
  })

  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300)

  // Any existing account can become a cave admin, so the search is not
  // restricted by role. A cave admin (academy context) may only list people
  // linked to its own cave, which the API requires as `caveId`.
  const { selectedContext } = useSession()
  const scopeToCave = selectedContext?.role === 'academy'
  const users = usePlatformUsers(
    {
      page: 1,
      limit: 10,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(scopeToCave ? { caveId } : {}),
    },
    {
      enabled:
        mode === 'existing' && debouncedSearch.length > 0 && Boolean(caveId),
    },
  )

  async function submit(input: CreateCaveAdminInput) {
    try {
      await mutations.create.mutateAsync(input)
      notify.success('Administrador vinculado à caverna.')
      reset({ name: '', email: '', password: '', userId: undefined })
      setSelectedUser(null)
      setSearchInput('')
      onSuccess?.()
    } catch (error) {
      notify.error(messageForAdminError(error))
    }
  }

  function changeMode(next: 'new' | 'existing') {
    setMode(next)
    reset({ name: '', email: '', password: '', userId: undefined })
    setSelectedUser(null)
    setSearchInput('')
  }

  function selectUser(user: PlatformUser) {
    setSelectedUser(user)
    setValue('userId', user.id)
    setSearchInput('')
  }

  function clearSelection() {
    setSelectedUser(null)
    setValue('userId', undefined)
    setSearchInput('')
  }

  const results = users.data?.items ?? []
  const isSearching = users.isPending && debouncedSearch.length > 0

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submit)} noValidate>
      <div role="tablist" aria-label="Tipo de administrador">
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'new'}
            aria-controls="new-account-panel"
            id="new-account-tab"
            className="border-b-2 border-transparent px-3 py-2 text-sm font-medium aria-selected:border-primary aria-selected:text-primary"
            onClick={() => changeMode('new')}
          >
            Nova conta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'existing'}
            aria-controls="existing-account-panel"
            id="existing-account-tab"
            className="border-b-2 border-transparent px-3 py-2 text-sm font-medium aria-selected:border-primary aria-selected:text-primary"
            onClick={() => changeMode('existing')}
          >
            Conta existente
          </button>
        </div>
      </div>

      {mode === 'new' ? (
        <div
          id="new-account-panel"
          role="tabpanel"
          aria-labelledby="new-account-tab"
          className="grid gap-4"
        >
          <label className="grid gap-2 text-sm font-medium">
            Nome
            <Input
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <span role="alert" className="text-xs text-destructive">
                {errors.name.message}
              </span>
            )}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            E-mail
            <Input
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <span role="alert" className="text-xs text-destructive">
                {errors.email.message}
              </span>
            )}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Senha inicial
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <span role="alert" className="text-xs text-destructive">
                {errors.password.message}
              </span>
            )}
          </label>
        </div>
      ) : (
        <div
          id="existing-account-panel"
          role="tabpanel"
          aria-labelledby="existing-account-tab"
        >
          <label className="grid gap-2 text-sm font-medium">
            Buscar conta por nome ou e-mail
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Ex.: maria@caverna.app"
              aria-invalid={!!errors.userId}
            />
          </label>

          {selectedUser && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card">
              <div>
                <p className="text-sm font-medium">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedUser.email}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                Remover seleção
              </Button>
            </div>
          )}

          {!selectedUser && debouncedSearch.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-card">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Buscando…
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nenhuma conta encontrada
                </div>
              ) : (
                <ul role="listbox" aria-label="Contas encontradas">
                  {results.map((user) => (
                    <li
                      key={user.id}
                      role="option"
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => selectUser(user)}
                    >
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="mt-1">
                        <RoleBadges roles={user.roles} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {errors.root?.message && (
        <p role="alert" className="text-xs text-destructive">
          {errors.root.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={
          isSubmitting ||
          mutations.create.isPending ||
          (mode === 'existing' && !selectedUser)
        }
      >
        {isSubmitting || mutations.create.isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {mode === 'new' ? 'Criar e vincular' : 'Vincular conta'}
      </Button>
    </form>
  )
}
