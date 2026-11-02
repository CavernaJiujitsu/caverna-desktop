import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { classDemoService, type ClassFilters } from '@/features/classes/services/class-demo.service'
import type { ClassInput } from '@/features/classes/schemas/class.schema'

export const classKeys = { all: ['classes', 'demo'] as const, list: (filters: ClassFilters) => ['classes', 'demo', filters] as const }

export function useClasses(filters: ClassFilters) {
  return useQuery({ queryKey: classKeys.list(filters), queryFn: ({ signal }) => classDemoService.list(filters, signal), staleTime: 0 })
}

export function useSaveClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ClassInput }) => id ? classDemoService.update(id, input) : classDemoService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}
