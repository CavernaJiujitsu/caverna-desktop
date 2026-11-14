import { z } from 'zod'

export const workoutItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  capacity: z.number().int().nonnegative(),
})

export const workoutListSchema = z.object({
  actorId: z.string().uuid(),
  practitionerId: z.string().uuid().optional(),
  caveId: z.string().uuid().optional(),
  items: z.array(workoutItemSchema),
})

export type WorkoutItem = z.infer<typeof workoutItemSchema>
export type WorkoutList = z.infer<typeof workoutListSchema>
