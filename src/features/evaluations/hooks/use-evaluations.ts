import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveEvaluation, listEvaluations, type EvaluationFilters } from '@/features/evaluations/services/evaluation.service'

export function useEvaluations(filters: EvaluationFilters) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: ({ signal }) => listEvaluations(filters, signal),
    enabled: Boolean(filters.caveId || filters.teacherId),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useApproveEvaluation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveEvaluation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evaluations'] }),
  })
}
