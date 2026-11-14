import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { academyService } from '@/features/academies/services/academy.service'
import type {
  Academy,
  AcademyInput,
} from '@/features/academies/schemas/academy.schema'
import type {
  UnitInput,
  UnitPage,
} from '@/features/academies/services/academy.service'
import type {
  ManagedUnit,
  UnitUpdateInput,
} from '@/features/academies/schemas/unit.schema'

export const academyKeys = {
  all: ['academies'] as const,
  units: (caveId: string) => ['academies', caveId, 'units'] as const,
  unitPage: (
    caveId: string,
    params: { page: number; limit: number; search?: string },
  ) => ['academies', caveId, 'units', params] as const,
  unit: (caveId: string, unitId: string) =>
    ['academies', caveId, 'units', unitId] as const,
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

export function useCaveUnit(caveId: string, unitId: string) {
  return useQuery<ManagedUnit>({
    queryKey: academyKeys.unit(caveId, unitId),
    queryFn: ({ signal }) => academyService.getUnit(caveId, unitId, signal),
    enabled: Boolean(caveId && unitId),
    staleTime: 60_000,
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
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: academyKeys.all })
  const invalidateUnitScope = async (caveId: string) => {
    await Promise.all([
      invalidate(),
      queryClient.invalidateQueries({ queryKey: academyKeys.units(caveId) }),
    ])
  }
  return {
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: AcademyInput }) =>
        academyService.update(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => academyService.remove(id),
      onSuccess: invalidate,
    }),
    createUnit: useMutation({
      mutationFn: ({
        caveId,
        input,
      }: {
        caveId: string
        input: Parameters<typeof academyService.createUnit>[1]
      }) => academyService.createUnit(caveId, input),
      onSuccess: (_, { caveId }) => invalidateUnitScope(caveId),
    }),
    updateUnit: useMutation({
      mutationFn: ({
        caveId,
        unitId,
        input,
      }: {
        caveId: string
        unitId: string
        input: Parameters<typeof academyService.updateUnit>[2]
      }) => academyService.updateUnit(caveId, unitId, input),
      onSuccess: (_, { caveId }) => invalidateUnitScope(caveId),
    }),
    removeUnit: useMutation({
      mutationFn: ({ caveId, unitId }: { caveId: string; unitId: string }) =>
        academyService.removeUnit(caveId, unitId),
      onSuccess: (_, { caveId }) => invalidateUnitScope(caveId),
    }),
    linkPractitioner: useMutation({
      mutationFn: ({
        caveId,
        unitId,
        practitionerId,
      }: {
        caveId: string
        unitId: string
        practitionerId: string
      }) => academyService.linkPractitioner(caveId, unitId, practitionerId),
      onSuccess: invalidate,
    }),
    unlinkPractitioner: useMutation({
      mutationFn: ({
        caveId,
        unitId,
        practitionerId,
      }: {
        caveId: string
        unitId: string
        practitionerId: string
      }) => academyService.unlinkPractitioner(caveId, unitId, practitionerId),
      onSuccess: invalidate,
    }),
  }
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

export function useUnitPractitioners(caveId: string, unitId: string) {
  return useQuery({
    queryKey: ['academies', caveId, 'units', unitId, 'practitioners'],
    queryFn: ({ signal }) =>
      academyService.listUnitPractitioners(caveId, unitId, signal),
    enabled: Boolean(caveId && unitId),
    staleTime: 60_000,
  })
}
