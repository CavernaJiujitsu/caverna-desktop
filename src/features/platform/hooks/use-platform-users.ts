import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformUserService } from '@/features/platform/services/platform-user.service'
import type {
  PlatformUsersFilter,
  PlatformUsersQuery,
} from '@/features/platform/schemas/user.schema'

type QueryOptions = { enabled?: boolean }

export const platformUserKeys = {
  all: ['platform', 'users'] as const,
  list: (query: PlatformUsersQuery) =>
    ['platform', 'users', 'list', query] as const,
  allList: (filters: PlatformUsersFilter) =>
    ['platform', 'users', 'all', filters] as const,
  item: (id: string) => ['platform', 'users', id] as const,
}

export function usePlatformUsers(
  query: PlatformUsersQuery,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: platformUserKeys.list(query),
    queryFn: ({ signal }) => platformUserService.list(query, signal),
    enabled: options?.enabled ?? true,
  })
}

export function useAllPlatformUsers(
  filters: PlatformUsersFilter,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: platformUserKeys.allList(filters),
    queryFn: ({ signal }) => platformUserService.listAll(filters, signal),
    enabled: options?.enabled ?? true,
  })
}

export function usePlatformUser(id: string) {
  return useQuery({
    queryKey: platformUserKeys.item(id),
    queryFn: ({ signal }) => platformUserService.findOne(id, signal),
    enabled: Boolean(id),
  })
}

export function useRemovePlatformUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => platformUserService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformUserKeys.all }),
  })
}
