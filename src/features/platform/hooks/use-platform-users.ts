import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformUserService } from '@/features/platform/services/platform-user.service'
import type {
  CreateManagementUserInput,
  GrantAccessInput,
  ManagementAccessRole,
  PlatformUsersFilter,
  PlatformUsersQuery,
  UserAccessView,
} from '@/features/platform/schemas/user.schema'

type QueryOptions = { enabled?: boolean }

export const platformUserKeys = {
  all: ['platform', 'users'] as const,
  list: (query: PlatformUsersQuery) =>
    ['platform', 'users', 'list', query] as const,
  allList: (filters: PlatformUsersFilter) =>
    ['platform', 'users', 'all', filters] as const,
  item: (id: string) => ['platform', 'users', id] as const,
  access: (id: string) => ['platform', 'users', id, 'access'] as const,
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

export function useUserAccess(id: string) {
  return useQuery({
    queryKey: platformUserKeys.access(id),
    queryFn: ({ signal }) => platformUserService.getAccess(id, signal),
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

/**
 * Access mutations answer with the fresh UserAccessView, which is written to
 * the cache before the user list (roles badges) is invalidated.
 */
export function useUserAccessMutations() {
  const queryClient = useQueryClient()
  const onSuccess = (view: UserAccessView) => {
    queryClient.setQueryData(platformUserKeys.access(view.userId), view)
    return queryClient.invalidateQueries({ queryKey: platformUserKeys.all })
  }

  return {
    create: useMutation({
      mutationFn: (input: CreateManagementUserInput) =>
        platformUserService.createManagementUser(input),
      onSuccess,
    }),
    grant: useMutation({
      mutationFn: ({
        userId,
        input,
      }: {
        userId: string
        input: GrantAccessInput
      }) => platformUserService.grantAccess(userId, input),
      onSuccess,
    }),
    revoke: useMutation({
      mutationFn: ({
        userId,
        role,
      }: {
        userId: string
        role: ManagementAccessRole
      }) => platformUserService.revokeAccess(userId, role),
      onSuccess,
    }),
  }
}
