import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { practitionerService } from '@/features/practitioners/services/practitioner.service'
import {
  type Practitioner,
  type PractitionerInput,
  type PractitionerUpdateInput,
} from '@/features/practitioners/schemas/practitioner.schema'

export const practitionerKeys = {
  all: ['practitioners'] as const,
  list: () => ['practitioners', 'list'] as const,
  item: (id: string) => ['practitioners', id] as const,
  trail: () => ['practitioners', 'trail'] as const,
  home: (id: string) => ['practitioners', id, 'home'] as const,
}

export function usePractitioners() {
  return useQuery({
    queryKey: practitionerKeys.list(),
    queryFn: ({ signal }) => practitionerService.list(signal),
    staleTime: 60_000,
    retry: 1,
  })
}

export function usePractitioner(id: string) {
  return useQuery({
    queryKey: practitionerKeys.item(id),
    queryFn: ({ signal }) => practitionerService.findOne(id, signal),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useCreatePractitioner() {
  const queryClient = useQueryClient()
  return useMutation<Practitioner, Error, PractitionerInput>({
    mutationFn: (input) => practitionerService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: practitionerKeys.all }),
  })
}

export function useUpdatePractitioner() {
  const queryClient = useQueryClient()
  return useMutation<
    Practitioner,
    Error,
    { id: string; input: PractitionerUpdateInput }
  >({
    mutationFn: ({ id, input }) => practitionerService.update(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: practitionerKeys.all })
      queryClient.invalidateQueries({ queryKey: practitionerKeys.item(id) })
    },
  })
}

export function useRemovePractitioner() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => practitionerService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: practitionerKeys.all }),
  })
}

export function usePractitionerTrail() {
  return useQuery({
    queryKey: practitionerKeys.trail(),
    queryFn: ({ signal }) => practitionerService.getMyTrail(signal),
    staleTime: 60_000,
    retry: 1,
  })
}

export function usePractitionerHome(id: string) {
  return useQuery({
    queryKey: practitionerKeys.home(id),
    queryFn: ({ signal }) => practitionerService.getHome(id, signal),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 1,
  })
}
