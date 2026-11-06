import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  classService,
  type ClassFilters,
} from '@/features/classes/services/class.service'
import type {
  ClassInput,
  Enrollment,
} from '@/features/classes/schemas/class.schema'

export const classKeys = {
  all: ['classes'] as const,
  list: (filters: ClassFilters) => ['classes', filters] as const,
  item: (id: string) => ['classes', id] as const,
  enrollments: (classId: string) =>
    ['classes', classId, 'enrollments'] as const,
}

export function useClasses(filters: ClassFilters) {
  return useQuery({
    queryKey: classKeys.list(filters),
    queryFn: ({ signal }) => classService.list(filters, signal),
    staleTime: 60_000,
  })
}

export function useClass(id: string) {
  return useQuery({
    queryKey: classKeys.item(id),
    queryFn: ({ signal }) => classService.findOne(id, signal),
    enabled: Boolean(id),
    staleTime: 60_000,
  })
}

export function useSaveClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ClassInput }) =>
      id ? classService.update(id, input) : classService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export function useRemoveClass() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => classService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export function useReplaceClassBelts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, beltIds }: { id: string; beltIds: string[] }) =>
      classService.replaceBelts(id, beltIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export function useEnrollClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      classId,
      practitionerId,
    }: {
      classId: string
      practitionerId: string
    }) => classService.enroll(classId, practitionerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export function useListEnrollments(classId: string) {
  return useQuery({
    queryKey: classKeys.enrollments(classId),
    queryFn: ({ signal }) => classService.listEnrollments(classId, signal),
    enabled: Boolean(classId),
    staleTime: 60_000,
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      classId,
      enrollmentId,
    }: {
      classId: string
      enrollmentId: string
    }) => classService.checkIn(classId, enrollmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export function useSetParticipation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      classId,
      enrollmentId,
      startedAt,
      endedAt,
      pauses,
      reason,
    }: {
      classId: string
      enrollmentId: string
      startedAt: string
      endedAt: string
      pauses?: { startedAt: string; endedAt: string }[]
      reason?: string
    }) =>
      classService.setParticipation(
        classId,
        enrollmentId,
        startedAt,
        endedAt,
        pauses,
        reason,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      classId,
      enrollmentId,
    }: {
      classId: string
      enrollmentId: string
    }) => classService.cancel(classId, enrollmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export type { Enrollment }
