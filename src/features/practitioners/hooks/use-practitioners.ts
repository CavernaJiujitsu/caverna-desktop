import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  type PractitionerListQuery,
  practitionerService,
} from '@/features/practitioners/services/practitioner.service'
import type {
  Practitioner,
  PractitionerInput,
} from '@/features/practitioners/schemas/practitioner.schema'

export const practitionerKeys = {
  all: ['practitioners'] as const,
  search: (search: string) => ['practitioners', 'search', search] as const,
  list: (query: PractitionerListQuery) =>
    ['practitioners', 'list', query] as const,
}

export function usePractitionerList(query: PractitionerListQuery) {
  return useQuery({
    queryKey: practitionerKeys.list(query),
    queryFn: ({ signal }) => practitionerService.list(query, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  })
}

export function usePractitionerSearch(search: string) {
  return useQuery({
    queryKey: practitionerKeys.search(search),
    queryFn: ({ signal }) => practitionerService.search(search, signal),
    enabled: search.length >= 2,
    staleTime: 30_000,
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
