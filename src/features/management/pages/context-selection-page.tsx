import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ContextSelection } from '@/features/management/components/context-selection'
import { ManagementShell } from '@/features/management/components/management-shell'
import { useManagementContexts } from '@/features/management/hooks/use-management-contexts'
import { useSession } from '@/shared/session/session'
import type { ManagementContext } from '@/shared/types/management-context'
import { notify } from '@/shared/lib/notifications'
import { Button } from '@/shared/components/ui/button'

const destinationByRole: Record<ManagementContext['role'], string> = {
  platform: routes.academies,
  academy: routes.academies,
  teacher: routes.classes,
}

export default function ContextSelectionPage() {
  const navigate = useNavigate()
  const { session } = useSession()
  const onSelected = useCallback(
    (context: ManagementContext) => {
      notify.success(`Contexto selecionado: ${context.label}`)
      navigate(destinationByRole[context.role], { replace: true })
    },
    [navigate],
  )
  const { contexts, select, pendingId, selectionError, refresh } =
    useManagementContexts(onSelected)
  if (!session) return <Navigate to={routes.login} replace />

  return (
    <ManagementShell>
      <ContextSelection
        contexts={contexts.data ?? []}
        status={
          contexts.isPending
            ? 'loading'
            : contexts.isError
              ? 'error'
              : 'success'
        }
        onSelect={(context) => void select(context)}
        onRetry={refresh}
        pendingId={pendingId}
        hasStudentProfile={Boolean(session.practitionerId)}
      />
      {selectionError && (
        <div className="mt-5 space-y-3">
          <p role="alert">{selectionError}</p>
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={Boolean(pendingId)}
          >
            Atualizar contextos
          </Button>
        </div>
      )}
    </ManagementShell>
  )
}
