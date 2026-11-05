import { useQuery } from '@tanstack/react-query'
import { evaluationDemoService, type EvaluationFilters } from '@/features/evaluations/services/evaluation-demo.service'

export function useEvaluations(filters: EvaluationFilters) {
  return useQuery({
    queryKey: ['evaluations', 'demo', filters],
    queryFn: ({ signal }) => evaluationDemoService.list(filters, signal),
    staleTime: 0,
  })
}
