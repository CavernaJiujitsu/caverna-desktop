import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/features/users/services/user.service'

export const userKeys = {
  all: ['users'] as const,
  list: () => ['users', 'list'] as const,
  item: (id: string) => ['users', id] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: ({ signal }) => userService.list(signal),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.item(id),
    queryFn: ({ signal }) => userService.findOne(id, signal),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useRemoveUser() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => userService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}
