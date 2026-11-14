import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { membershipService } from '@/features/memberships/services/membership.service'

export const membershipKeys = {
  all: ['memberships', 'students'] as const,
  students: (caveUnitId: string) =>
    ['memberships', 'students', caveUnitId] as const,
}

export function useStudentMemberships(caveUnitId: string) {
  return useQuery({
    queryKey: membershipKeys.students(caveUnitId),
    queryFn: ({ signal }) => membershipService.listStudents(caveUnitId, signal),
    enabled: Boolean(caveUnitId),
  })
}

export function useStudentMembershipMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: membershipKeys.all })
  return {
    link: useMutation({
      mutationFn: ({
        practitionerId,
        caveUnitId,
      }: {
        practitionerId: string
        caveUnitId: string
      }) => membershipService.linkStudent(practitionerId, caveUnitId),
      onSuccess: invalidate,
    }),
    unlink: useMutation({
      mutationFn: ({
        practitionerId,
        caveUnitId,
      }: {
        practitionerId: string
        caveUnitId: string
      }) => membershipService.unlinkStudent(practitionerId, caveUnitId),
      onSuccess: invalidate,
    }),
  }
}
