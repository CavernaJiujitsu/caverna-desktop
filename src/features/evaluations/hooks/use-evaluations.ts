import { useQuery } from '@tanstack/react-query'
import { listEvaluations, type EvaluationFilters } from '@/features/evaluations/services/evaluation.service'

export function useEvaluations(filters: EvaluationFilters) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: ({ signal }) => listEvaluations(filters, signal),
    staleTime: 60_000,
    retry: 1,
  })
}
