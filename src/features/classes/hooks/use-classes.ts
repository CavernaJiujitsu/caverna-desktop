import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  classService,
  type ClassListQuery,
  type ParticipationInput,
} from '@/features/classes/services/class.service'
import type { ClassFormValues } from '@/features/classes/schemas/class.schema'

export const classKeys = {
  all: ['classes'] as const,
  list: (query: ClassListQuery) => ['classes', 'list', query] as const,
  item: (id: string) => ['classes', 'item', id] as const,
  enrollments: (classId: string) =>
    ['classes', 'enrollments', classId] as const,
}

/** One server page of classes; the previous page stays visible while paging. */
export function useClasses(query: ClassListQuery, enabled = true) {
  return useQuery({
    queryKey: classKeys.list(query),
    queryFn: ({ signal }) => classService.listPage(query, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useClass(id: string) {
  return useQuery({
    queryKey: classKeys.item(id),
    queryFn: ({ signal }) => classService.findOne(id, signal),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 1,
  })
}

export function useEnrollments(classId: string) {
  return useQuery({
    queryKey: classKeys.enrollments(classId),
    queryFn: ({ signal }) => classService.listEnrollments(classId, signal),
    enabled: Boolean(classId),
    staleTime: 15_000,
    retry: 1,
  })
}

export function useClassMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: classKeys.all })

  return {
    save: useMutation({
      mutationFn: ({
        id,
        values,
        previousTeacherId,
      }: {
        id?: string
        values: ClassFormValues
        previousTeacherId?: string
      }) =>
        id
          ? classService.update(id, values, previousTeacherId)
          : classService.create(values).then(() => undefined),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => classService.remove(id),
      onSuccess: invalidate,
    }),
  }
}

type EnrollmentTarget = { enrollmentId: string }

export function useAttendanceMutations(classId: string) {
  const queryClient = useQueryClient()
  // Attendance changes also affect belt-validation prerequisites.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: classKeys.enrollments(classId),
      }),
      queryClient.invalidateQueries({ queryKey: ['evaluations'] }),
    ])

  return {
    enroll: useMutation({
      mutationFn: (practitionerId: string) =>
        classService.enroll(classId, practitionerId),
      onSuccess: invalidate,
    }),
    checkIn: useMutation({
      mutationFn: ({ enrollmentId }: EnrollmentTarget) =>
        classService.checkIn(classId, enrollmentId),
      onSuccess: invalidate,
    }),
    participation: useMutation({
      mutationFn: ({
        enrollmentId,
        input,
      }: {
        enrollmentId: string
        input: ParticipationInput
      }) => classService.setParticipation(classId, enrollmentId, input),
      onSuccess: invalidate,
    }),
    cancel: useMutation({
      mutationFn: ({ enrollmentId }: EnrollmentTarget) =>
        classService.cancelEnrollment(classId, enrollmentId),
      onSuccess: invalidate,
    }),
  }
}
