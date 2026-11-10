import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { managementContextService } from '@/features/management/services/management-context.service'
import { getAccessToken } from '@/shared/session/access-token'
import { useSession } from '@/shared/session/session'
import { AppError } from '@/shared/types/app-error'
import type { ManagementContext } from '@/shared/types/management-context'

export function useManagementContexts(
  onSelected: (context: ManagementContext) => void,
) {
  const { session, setSelectedContext } = useSession()
  const active = useRef(true)
  const locked = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const contexts = useQuery({
    queryKey: ['management-contexts', session?.user.id],
    queryFn: ({ signal }) => managementContextService.list(signal),
    enabled: Boolean(session),
  })
  const selection = useMutation({
    mutationFn: (id: string) => managementContextService.switch(id),
  })

  async function select(context: ManagementContext) {
    if (!session || locked.current) return
    const token = session.accessToken
    locked.current = true
    setSelectedContext(null)
    try {
      const confirmed = await selection.mutateAsync(context.id)
      if (!active.current || getAccessToken() !== token) return
      setSelectedContext(confirmed)
      onSelected(confirmed)
    } catch {
      // The mutation exposes a recoverable error; failed access never selects a context.
    } finally {
      locked.current = false
    }
  }

  return {
    contexts,
    select,
    pendingId: selection.isPending ? selection.variables : undefined,
    selectionError: selection.isError
      ? selection.error instanceof AppError &&
        selection.error.kind === 'forbidden'
        ? 'Esse acesso não está mais disponível. Atualize os contextos e escolha novamente.'
        : 'Não foi possível validar o contexto. Tente novamente.'
      : null,
    refresh: () => {
      selection.reset()
      void contexts.refetch()
    },
  }
}
