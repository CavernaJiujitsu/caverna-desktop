import { z } from 'zod'

export const trailMovementSchema = z.object({
  id: z.string().uuid(),
  trailStageMovementId: z.string().uuid(),
  movementId: z.string().uuid(),
  movementName: z.string(),
  videoUrl: z.string().url().nullable().optional(),
  required: z.boolean(),
  position: z.number().int().positive(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VALIDATED']),
  validatedAt: z.string().datetime().nullable().optional(),
  evidenceId: z.string().uuid().nullable().optional(),
})

export type TrailMovement = z.infer<typeof trailMovementSchema>

export const trailStageSchema = z.object({
  id: z.string().uuid(),
  trailStageId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  position: z.number().int().positive(),
  movements: z.array(trailMovementSchema),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  percent: z.number().int().min(0).max(100),
  requiredCompleted: z.number().int().min(0),
  requiredTotal: z.number().int().min(0),
  isCurrent: z.boolean(),
})

export type TrailStage = z.infer<typeof trailStageSchema>

export const trailSchema = z.object({
  practitionerId: z.string().uuid(),
  beltId: z.string().uuid(),
  beltName: z.string(),
  beltColor: z.string(),
  beltLevel: z.number().int().positive(),
  trailId: z.string().uuid(),
  trailName: z.string(),
  trailDescription: z.string().nullable().optional(),
  stages: z.array(trailStageSchema),
  percent: z.number().int().min(0).max(100),
  requiredCompleted: z.number().int().min(0),
  requiredTotal: z.number().int().min(0),
  currentStageId: z.string().uuid().nullable().optional(),
  noActiveBelt: z.boolean(),
})

export type Trail = z.infer<typeof trailSchema>

export const noActiveBeltSchema = z.object({
  noActiveBelt: z.literal(true),
  message: z.string(),
  practitionerId: z.string().uuid(),
})

export type NoActiveBelt = z.infer<typeof noActiveBeltSchema>

const trailResponseSchema = z.object({
  data: z.union([trailSchema, noActiveBeltSchema]),
})

export const homeSchema = z.object({
  practitioner: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  nextClass: z
    .object({
      id: z.string().uuid(),
      type: z.enum(['SCHEDULED', 'VALIDATION', 'EXAM']),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime(),
      caveUnit: z.object({ id: z.string().uuid(), name: z.string() }),
      teacher: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
    })
    .nullable(),
  nearbyCaves: z.object({
    data: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        distance: z.string().optional(),
      }),
    ),
    locationSource: z.enum(['none', 'query', 'profile']),
  }),
})

export type Home = z.infer<typeof homeSchema>

const homeResponseSchema = z.object({
  data: homeSchema,
})

export { trailResponseSchema, homeResponseSchema }
