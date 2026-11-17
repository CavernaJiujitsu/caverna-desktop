import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  trainingService,
  type TrainingQuery,
} from '@/features/trainings/services/training.service'

export const trainingKeys = {
  all: ['trainings'] as const,
  list: (query: TrainingQuery) => ['trainings', 'list', query] as const,
}

export function useTrainings(query: TrainingQuery, enabled = true) {
  return useQuery({
    queryKey: trainingKeys.list(query),
    queryFn: ({ signal }) => trainingService.list(query, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  })
}
