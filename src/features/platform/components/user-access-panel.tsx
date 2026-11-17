import { LoaderCircle, ShieldAlert, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { GrantAccessForm } from '@/features/platform/components/access-forms'
import {
  useRemovePlatformUser,
  useUserAccess,
  useUserAccessMutations,
} from '@/features/platform/hooks/use-platform-users'
import {
  accessLockReason,
  grantableRoles,
  type ManagementAccessRole,
  type UserAccessView,
} from '@/features/platform/schemas/user.schema'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'
import { RoleBadges } from '@/features/platform/components/role-badges'

type AccessEntry = {
  key: string
  label: string
  detail?: string
  revocable?: ManagementAccessRole
}

function accessEntries(access: UserAccessView): AccessEntry[] {
  const entries: AccessEntry[] = []
  if (access.isRoot)
    entries.push({
      key: 'root',
      label: 'Root',
      detail: 'Super usuário da plataforma.',
    })
  if (access.roles.includes('ADMIN'))
    entries.push({
      key: 'admin',
      label: 'Administrador da plataforma',
      // ROOT carries ADMIN implicitly; it is never revoked.
      ...(access.isRoot ? {} : { revocable: 'ADMIN' as const }),
    })
  if (access.caveAdmin)
    entries.push({
      key: 'cave-admin',
      label: 'Gestor de caverna',
      detail: access.caveAdmin.caveName,
      revocable: 'CAVE_ADMIN',
    })
  if (access.teacher)
    entries.push({
      key: 'teacher',
      label: 'Professor',
      detail:
        access.teacher.caveUnits.length > 0
          ? access.teacher.caveUnits.map((unit) => unit.name).join(', ')
          : 'Sem unidades vinculadas',
      revocable: 'TEACHER',
    })
  if (access.practitionerId)
    entries.push({
      key: 'student',
      label: 'Aluno',
      detail: 'Perfil de praticante.',
    })
  return entries
}

function DeleteUserPanel({
  access,
  onDeleted,
}: {
  access: UserAccessView
  onDeleted: () => void
}) {
  const removeUser = useRemovePlatformUser()
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const confirmed = confirmation === access.email

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!confirmed) return
    setError(null)
    try {
      await removeUser.mutateAsync(access.userId)
      notify.success('Usuário removido.')
      onDeleted()
    } catch (mutationError) {
      setError(
        getErrorMessage(mutationError, 'Não foi possível remover o usuário.'),
      )
    }
  }

  return (
    <form
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      <h3 className="text-sm font-semibold text-destructive">
        Remover definitivamente
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta ação remove a conta e os vínculos em cascata. Digite o e-mail exato{' '}
        <strong>{access.email}</strong> para confirmar.
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

export function UserAccessPanel({
  userId,
  onClose,
  onDeleted,
}: {
  userId: string
  onClose: () => void
  onDeleted: () => void
}) {
  const { session } = useSession()
  const access = useUserAccess(userId)
  const mutations = useUserAccessMutations()
  const actorRoles = session?.roles ?? []
  const actorIsRoot = actorRoles.includes('ROOT')

  async function revoke(role: ManagementAccessRole, label: string) {
    if (
      !window.confirm(`Revogar o acesso "${label}"? A conta será preservada.`)
    )
      return
    try {
      await mutations.revoke.mutateAsync({ userId, role })
      notify.success('Acesso revogado.')
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível revogar o acesso.'))
    }
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      aria-labelledby="user-detail-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="user-detail-title" className="text-lg font-semibold">
          Acessos do usuário
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
      {access.isPending ? (
        <LoadingState label="Carregando acessos…" />
      ) : access.isError ? (
        <ErrorState
          message={getErrorMessage(
            access.error,
            'Não foi possível carregar os acessos do usuário.',
          )}
          onRetry={() => void access.refetch()}
          retryLabel="Tentar novamente"
        />
      ) : (
        <UserAccessDetail
          access={access.data}
          lockReason={accessLockReason(
            { userId: session?.user.id ?? '', roles: actorRoles },
            {
              userId: access.data.userId,
              roles: access.data.roles,
              isRoot: access.data.isRoot,
            },
          )}
          actorIsRoot={actorIsRoot}
          revoking={mutations.revoke.isPending}
          onRevoke={(role, label) => void revoke(role, label)}
          onDeleted={onDeleted}
        />
      )}
    </section>
  )
}

function UserAccessDetail({
  access,
  lockReason,
  actorIsRoot,
  revoking,
  onRevoke,
  onDeleted,
}: {
  access: UserAccessView
  lockReason: string | null
  actorIsRoot: boolean
  revoking: boolean
  onRevoke: (role: ManagementAccessRole, label: string) => void
  onDeleted: () => void
}) {
  const entries = accessEntries(access)
  const locked = lockReason !== null
  // A user holds each management access at most once (409 otherwise).
  const roleOptions = grantableRoles(actorIsRoot).filter(
    (role) =>
      !(role === 'ADMIN' && access.roles.includes('ADMIN')) &&
      !(role === 'CAVE_ADMIN' && access.caveAdmin) &&
      !(role === 'TEACHER' && access.teacher),
  )

  return (
    <div className="mt-4 grid gap-5">
      <div>
        <p className="font-medium">{access.name}</p>
        <p className="text-sm text-muted-foreground">{access.email}</p>
        <div className="mt-2">
          <RoleBadges roles={access.roles} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Acessos atuais</h3>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum acesso de gestão.
          </p>
        ) : (
          <ul
            className="mt-2 divide-y divide-border rounded-lg border border-border"
            aria-label="Acessos atuais"
          >
            {entries.map((entry) => (
              <li
                key={entry.key}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{entry.label}</p>
                  {entry.detail && (
                    <p className="text-xs text-muted-foreground">
                      {entry.detail}
                    </p>
                  )}
                </div>
                {!locked &&
                entry.revocable &&
                (entry.revocable !== 'ADMIN' || actorIsRoot) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={revoking}
                    onClick={() => {
                      if (entry.revocable)
                        onRevoke(entry.revocable, entry.label)
                    }}
                  >
                    Revogar
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {locked ? (
        <p
          role="note"
          className="flex items-start gap-2 rounded-lg border border-border bg-accent p-3 text-sm text-muted-foreground"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {lockReason}
        </p>
      ) : (
        <>
          {roleOptions.length > 0 ? (
            <GrantAccessForm
              key={roleOptions.join('|')}
              access={access}
              roleOptions={roleOptions}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Este usuário já possui todos os acessos que você pode conceder.
              Ajuste as unidades de professores na tela de professores.
            </p>
          )}
          <DeleteUserPanel access={access} onDeleted={onDeleted} />
        </>
      )}
    </div>
  )
}
