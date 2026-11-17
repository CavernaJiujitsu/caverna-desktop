import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { classService } from '@/features/classes/services/class.service'
import { addDays } from '@/features/classes/services/class-dates'
import {
  approveEvaluation,
  cancelEvaluation,
  listEvaluations,
  rejectEvaluation,
  scheduleEvaluation,
  type EvaluationFilters,
} from '@/features/evaluations/services/evaluation.service'

export const evaluationKeys = {
  all: ['evaluations'] as const,
  list: (filters: EvaluationFilters) =>
    ['evaluations', 'list', filters] as const,
}

/** One server page of the queue; the previous page stays visible while paging. */
export function useEvaluations(filters: EvaluationFilters, enabled: boolean) {
  return useQuery({
    queryKey: evaluationKeys.list(filters),
    queryFn: ({ signal }) => listEvaluations(filters, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  })
}

/**
 * Upcoming classes (next 30 days) that can host a belt validation:
 * VALIDATION or SCHEDULED. The API scopes them to the academy cave or to the
 * teacher, so no unit list is needed (and its failure cannot empty the list).
 */
export function useValidationClassOptions(
  scope: { caveId?: string; teacherId?: string },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['classes', 'validation-options', scope] as const,
    queryFn: async ({ signal }) => {
      const now = new Date()
      const items = await classService.list(
        {
          caveId: scope.caveId,
          teacherId: scope.teacherId,
          from: now.toISOString(),
          to: addDays(now, 30).toISOString(),
        },
        signal,
      )
      return items.filter(
        (item) => item.type === 'VALIDATION' || item.type === 'SCHEDULED',
      )
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useEvaluationMutations() {
  const queryClient = useQueryClient()
  // Scheduling enrolls the student in the class, so classes are refreshed too.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: evaluationKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['classes'] }),
    ])

  return {
    schedule: useMutation({
      mutationFn: ({ id, classId }: { id: string; classId: string }) =>
        scheduleEvaluation(id, classId),
      onSuccess: invalidate,
    }),
    approve: useMutation({
      mutationFn: ({
        id,
        approvedBeltId,
        notes,
      }: {
        id: string
        approvedBeltId?: string
        notes?: string
      }) => approveEvaluation(id, { approvedBeltId, notes }),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: ({
        id,
        suggestedBeltId,
        notes,
      }: {
        id: string
        suggestedBeltId: string
        notes?: string
      }) => rejectEvaluation(id, { suggestedBeltId, notes }),
      onSuccess: invalidate,
    }),
    cancel: useMutation({
      mutationFn: (id: string) => cancelEvaluation(id),
      onSuccess: invalidate,
    }),
  }
}
