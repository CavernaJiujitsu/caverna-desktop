import { useQuery } from '@tanstack/react-query'
import { workoutService } from '@/features/workouts/services/workout.service'

export const workoutKeys = {
  all: ['workouts'] as const,
  list: () => ['workouts', 'list'] as const,
}

export function useWorkouts() {
  return useQuery({
    queryKey: workoutKeys.list(),
    queryFn: ({ signal }) => workoutService.list(signal),
  })
}
