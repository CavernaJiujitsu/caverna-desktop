import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ContextSelection } from '@/features/management/components/context-selection'
import { useSession } from '@/shared/session/session'
import { managementContextService } from '@/features/management/services/management-context.service'
import type { ManagementContext } from '@/shared/types/management-context'
import { notify } from '@/shared/lib/notifications'

const destinationByRole: Record<ManagementContext['role'], string> = {
  platform: routes.dashboard,
  academy: routes.academies,
  teacher: routes.dashboard,
}

export default function ContextSelectionPage() {
  const navigate = useNavigate()
  const { contexts, setSelectedContext } = useSession()

  const handleSelect = useCallback(
    async (context: ManagementContext) => {
      await managementContextService.switch(context.id)
      setSelectedContext(context)
      notify.success(`Contexto selecionado: ${context.label}`)
      navigate(destinationByRole[context.role], { replace: true })
    },
    [navigate, setSelectedContext],
  )

  const handleRetry = useCallback(() => {
    void navigate(routes.management, { replace: true })
  }, [navigate])

  return (
    <ContextSelection
      contexts={contexts}
      status="success"
      onSelect={handleSelect}
      onRetry={handleRetry}
    />
  )
}
