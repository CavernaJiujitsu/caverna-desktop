import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { academyService } from '@/features/academies/services/academy.service'
import type {
  UnitInput,
  UnitPage,
} from '@/features/academies/services/academy.service'
import type { UnitUpdateInput } from '@/features/academies/schemas/unit.schema'

export const academyKeys = {
  all: ['academies'] as const,
  units: (caveId: string) => ['academies', caveId, 'units'] as const,
  unitPage: (
    caveId: string,
    params: { page: number; limit: number; search?: string },
  ) => ['academies', caveId, 'units', params] as const,
}

export function useAcademies(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: academyKeys.all,
    queryFn: ({ signal }) => academyService.list(signal),
    enabled: options.enabled ?? true,
  })
}

export function useCaveUnits(caveId: string) {
  return useQuery({
    queryKey: academyKeys.units(caveId),
    queryFn: ({ signal }) => academyService.listUnits(caveId, signal),
    enabled: Boolean(caveId),
    staleTime: 60_000,
  })
}

export function useCaveUnitPage(
  caveId: string,
  params: { page: number; limit: number; search?: string },
) {
  return useQuery<UnitPage>({
    queryKey: academyKeys.unitPage(caveId, params),
    queryFn: ({ signal }) =>
      academyService.listUnitsPage(caveId, params, signal),
    enabled: Boolean(caveId),
    staleTime: 60_000,
  })
}

export function useAllManagedCaveUnits(caveId: string) {
  return useQuery({
    queryKey: ['academies', caveId, 'units', 'all'] as const,
    queryFn: ({ signal }) => academyService.listAllManagedUnits(caveId, signal),
    enabled: Boolean(caveId),
    staleTime: 60_000,
  })
}

export function useUnitManagementMutations(caveId: string) {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: academyKeys.units(caveId) }),
      queryClient.invalidateQueries({ queryKey: academyKeys.all }),
    ])
  }

  return {
    create: useMutation({
      mutationFn: (input: UnitInput) =>
        academyService.createUnit(caveId, input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        unitId,
        input,
      }: {
        unitId: string
        input: UnitUpdateInput
      }) => academyService.updateUnit(caveId, unitId, input),
      onSuccess: invalidate,
    }),
    archive: useMutation({
      mutationFn: (unitId: string) => academyService.removeUnit(caveId, unitId),
      onSuccess: invalidate,
    }),
    reactivate: useMutation({
      mutationFn: (unitId: string) =>
        academyService.updateUnit(caveId, unitId, { active: true }),
      onSuccess: invalidate,
    }),
  }
}
