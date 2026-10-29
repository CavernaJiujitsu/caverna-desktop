import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { academyDemoService } from '@/features/academies/services/academy-demo.service'
import type {
  Academy,
  AcademyInput,
} from '@/features/academies/schemas/academy.schema'

export const academyKeys = { all: ['academies', 'demo'] as const }

export function useAcademies() {
  return useQuery({
    queryKey: academyKeys.all,
    queryFn: ({ signal }) => academyDemoService.list(signal),
  })
}

export function useCreateAcademy() {
  const queryClient = useQueryClient()
  return useMutation<Academy, Error, AcademyInput>({
    mutationFn: (input) => academyDemoService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: academyKeys.all }),
  })
}
