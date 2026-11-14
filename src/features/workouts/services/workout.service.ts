import { http, normalizeHttpError } from '@/shared/lib/axios'
import { envelopeSchema } from '@/shared/lib/api-schema'
import {
  workoutListSchema,
  type WorkoutList,
} from '@/features/workouts/schemas/workout.schema'

const ENDPOINTS = {
  list: '/desktop/workouts',
} as const

const workoutListResponseSchema = envelopeSchema(workoutListSchema)

export const workoutService = {
  async list(signal?: AbortSignal): Promise<WorkoutList> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.list, { signal })
      return workoutListResponseSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
