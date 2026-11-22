import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { membershipService } from '@/features/memberships/services/membership.service'
import { practitionerKeys } from '@/features/practitioners/hooks/use-practitioners'

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
  // Reloads on settle, not only on success: a 404/409 means the cached roster
  // is stale, and the API is the only source of which links are active.
  // Student lists show each student's units, so they reload as well.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: membershipKeys.all }),
      queryClient.invalidateQueries({ queryKey: practitionerKeys.all }),
    ])
  return {
    link: useMutation({
      mutationFn: ({
        practitionerId,
        caveUnitId,
      }: {
        practitionerId: string
        caveUnitId: string
      }) => membershipService.linkStudent(practitionerId, caveUnitId),
      onSettled: invalidate,
    }),
    unlink: useMutation({
      mutationFn: ({
        practitionerId,
        caveUnitId,
      }: {
        practitionerId: string
        caveUnitId: string
      }) => membershipService.unlinkStudent(practitionerId, caveUnitId),
      onSettled: invalidate,
    }),
  }
}
