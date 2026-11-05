import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { academyService } from '@/features/academies/services/academy.service'
import type {
  Academy,
  AcademyInput,
} from '@/features/academies/schemas/academy.schema'

export const academyKeys = { all: ['academies'] as const }

export function useAcademies() {
  return useQuery({
    queryKey: academyKeys.all,
    queryFn: ({ signal }) => academyService.list(signal),
  })
}

export function useCreateAcademy() {
  const queryClient = useQueryClient()
  return useMutation<Academy, Error, AcademyInput>({
    mutationFn: (input) => academyService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: academyKeys.all }),
  })
}
