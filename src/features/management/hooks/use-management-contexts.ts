import { useMutation, useQuery } from '@tanstack/react-query'
import { managementContextService } from '@/features/management/services/management-context.service'
import { useSession } from '@/shared/session/session'
import { AppError } from '@/shared/types/app-error'

export const managementContextKeys = {
  all: ['management-contexts'] as const,
  list: (userId: string) => ['management-contexts', userId] as const,
}

export function useManagementContexts() {
  const { session } = useSession()
  return useQuery({
    queryKey: managementContextKeys.list(session?.user.id ?? 'anonymous'),
    queryFn: ({ signal }) => managementContextService.list(signal),
    enabled: Boolean(session),
    staleTime: 30_000,
  })
}

export function useContextSelection() {
  const { setSelectedContext } = useSession()
  return useMutation({
    mutationFn: (contextId: string) =>
      managementContextService.switch(contextId),
    onSuccess: (context) => setSelectedContext(context),
  })
}

export function messageForContextError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.kind === 'forbidden')
      return 'Esse acesso não está mais disponível. Atualize os contextos e escolha novamente.'
    if (error.kind === 'network' || error.kind === 'timeout')
      return 'Não foi possível falar com o servidor. Tente novamente.'
  }
  return 'Não foi possível validar o contexto. Tente novamente.'
}
