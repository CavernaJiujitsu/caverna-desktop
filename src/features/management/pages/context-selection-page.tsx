import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ContextSelection } from '@/features/management/components/context-selection'
import { useSession } from '@/shared/session/session'
import { managementContextService } from '@/features/management/services/management-context.service'
import type { ManagementContext } from '@/shared/types/management-context'
import { notify } from '@/shared/lib/notifications'

const destinationByRole: Record<ManagementContext['role'], string> = {
  platform: routes.academies,
  academy: routes.academies,
  teacher: routes.classes,
}

export default function ContextSelectionPage() {
  const navigate = useNavigate()
  const { session, contexts, setSelectedContext } = useSession()

  const handleSelect = useCallback(
    async (context: ManagementContext) => {
      // #98 owns authorized contexts. Until the switch endpoint exists, a
      // failed request must not block the local selection.
      try {
        await managementContextService.switch(context.id)
      } catch {
        // Expected while the backend has no context switch contract.
      }
      setSelectedContext(context)
      notify.success(`Contexto selecionado: ${context.label}`)
      navigate(destinationByRole[context.role], { replace: true })
    },
    [navigate, setSelectedContext],
  )

  const handleRetry = useCallback(() => {
    void navigate(routes.management, { replace: true })
  }, [navigate])

  if (!session) return <Navigate to={routes.login} replace />

  return (
    <ContextSelection
      contexts={contexts}
      status="success"
      onSelect={handleSelect}
      onRetry={handleRetry}
    />
  )
}
