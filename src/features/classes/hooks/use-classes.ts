import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { classService, type ClassFilters } from '@/features/classes/services/class.service'
import type { ClassInput } from '@/features/classes/schemas/class.schema'

export const classKeys = { all: ['classes'] as const, list: (filters: ClassFilters) => ['classes', filters] as const }

export function useClasses(filters: ClassFilters) {
  return useQuery({ queryKey: classKeys.list(filters), queryFn: ({ signal }) => classService.list(filters, signal), staleTime: 60_000 })
}

export function useSaveClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ClassInput }) => id ? classService.update(id, input) : classService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, enrollmentId }: { classId: string; enrollmentId: string }) => classService.checkIn(classId, enrollmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}
