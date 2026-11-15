import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformCaveService } from '@/features/platform/services/platform-cave.service'
import type {
  CreateCaveAdminInput,
  CreatePlatformCaveInput,
  UpdatePlatformCaveInput,
} from '@/features/platform/schemas/cave.schema'

export const platformCaveKeys = {
  all: ['platform', 'caves'] as const,
  list: () => ['platform', 'caves', 'list'] as const,
  item: (id: string) => ['platform', 'caves', id] as const,
  units: (id: string) => ['platform', 'caves', id, 'units'] as const,
  admins: (id: string) => ['platform', 'caves', id, 'admins'] as const,
}

export function usePlatformCaves(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: platformCaveKeys.list(),
    queryFn: ({ signal }) => platformCaveService.list(signal),
    enabled: options.enabled ?? true,
  })
}

export function usePlatformCave(caveId: string) {
  return useQuery({
    queryKey: platformCaveKeys.item(caveId),
    queryFn: ({ signal }) => platformCaveService.get(caveId, signal),
    enabled: Boolean(caveId),
  })
}

export function usePlatformCaveUnits(id: string) {
  return useQuery({
    queryKey: platformCaveKeys.units(id),
    queryFn: ({ signal }) => platformCaveService.listUnits(id, signal),
    enabled: Boolean(id),
  })
}

export function useCaveAdmins(caveId: string) {
  return useQuery({
    queryKey: platformCaveKeys.admins(caveId),
    queryFn: ({ signal }) => platformCaveService.listAdmins(caveId, signal),
    enabled: Boolean(caveId),
  })
}

export function useCaveAdminMutations(caveId: string) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: platformCaveKeys.admins(caveId),
    })

  return {
    create: useMutation({
      mutationFn: (input: CreateCaveAdminInput) =>
        platformCaveService.createAdmin(caveId, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (adminId: string) =>
        platformCaveService.removeAdmin(caveId, adminId),
      onSuccess: invalidate,
    }),
  }
}

export function useCreatePlatformCave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlatformCaveInput) =>
      platformCaveService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformCaveKeys.all }),
  })
}

export function useUpdatePlatformCave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      caveId,
      input,
    }: {
      caveId: string
      input: UpdatePlatformCaveInput
    }) => platformCaveService.update(caveId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformCaveKeys.all }),
  })
}

export function useArchivePlatformCave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (caveId: string) => platformCaveService.archive(caveId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformCaveKeys.all }),
  })
}


