import { LockKeyhole, LogOut } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ContextSelection } from '@/features/management/components/context-selection'
import {
  messageForContextError,
  useContextSelection,
  useManagementContexts,
} from '@/features/management/hooks/use-management-contexts'
import { useSession } from '@/shared/session/session'
import type { ManagementContext } from '@/shared/types/management-context'
import { Button } from '@/shared/components/ui/button'
import { notify } from '@/shared/lib/notifications'

const destinationByRole: Record<ManagementContext['role'], string> = {
  platform: routes.platformCaves,
  academy: routes.classes,
  teacher: routes.classes,
}

export default function ContextSelectionPage() {
  const navigate = useNavigate()
  const { session, clearSession } = useSession()
  const contexts = useManagementContexts()
  const selection = useContextSelection()
  const [selectionError, setSelectionError] = useState<string | null>(null)

  const handleSelect = useCallback(
    async (context: ManagementContext) => {
      setSelectionError(null)
      try {
        const confirmed = await selection.mutateAsync(context.id)
        notify.success(`Contexto selecionado: ${confirmed.label}`)
        navigate(destinationByRole[confirmed.role], { replace: true })
      } catch (error) {
        setSelectionError(messageForContextError(error))
      }
    },
    [navigate, selection],
  )

  const handleSignOut = useCallback(() => {
    clearSession()
    void navigate(routes.login, { replace: true })
  }, [clearSession, navigate])

  if (!session) return <Navigate to={routes.login} replace />

  return (
    <main className="management-surface relative flex min-h-svh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,53,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(8,185,174,0.12),transparent_36%)]"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="h-6 w-1 rounded-full bg-primary"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-black tracking-[0.24em]">CAVERNA</p>
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                BJJ · Gestão
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </Button>
        </header>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <ContextSelection
            contexts={contexts.data ?? []}
            status={
              contexts.isPending
                ? 'loading'
                : contexts.isError
                  ? 'error'
                  : 'success'
            }
            pendingId={selection.isPending ? selection.variables : undefined}
            errorMessage={selectionError}
            onSelect={(context) => void handleSelect(context)}
            onRetry={() => {
              setSelectionError(null)
              void contexts.refetch()
            }}
            onSignOut={handleSignOut}
          />
        </div>

        <footer className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          Acesso restrito a perfis autorizados.
        </footer>
      </div>
    </main>
  )
}
