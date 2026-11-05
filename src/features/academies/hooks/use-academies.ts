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

export function useAcademyMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: academyKeys.all })
  return {
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: AcademyInput }) => academyService.update(id, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => academyService.remove(id), onSuccess: invalidate }),
    createUnit: useMutation({ mutationFn: ({ caveId, input }: { caveId: string; input: Parameters<typeof academyService.createUnit>[1] }) => academyService.createUnit(caveId, input), onSuccess: invalidate }),
    updateUnit: useMutation({ mutationFn: ({ caveId, unitId, input }: { caveId: string; unitId: string; input: Parameters<typeof academyService.updateUnit>[2] }) => academyService.updateUnit(caveId, unitId, input), onSuccess: invalidate }),
    removeUnit: useMutation({ mutationFn: ({ caveId, unitId }: { caveId: string; unitId: string }) => academyService.removeUnit(caveId, unitId), onSuccess: invalidate }),
  }
}
