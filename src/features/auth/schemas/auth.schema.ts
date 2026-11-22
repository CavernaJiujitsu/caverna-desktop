import { z } from 'zod'
import { USER_ROLES } from '@/shared/types/user-role'

const uuid = z.string().uuid()

// The backend wraps every success response in { message, data, timestamp }.
export const loginResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    accessToken: z.string().min(1),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int().positive(),
    userId: uuid,
    roles: z.array(z.enum(USER_ROLES)).min(1),
    practitionerId: uuid.optional(),
    teacherId: uuid.optional(),
    caveId: uuid.optional(),
  }),
  timestamp: z.string().optional(),
})

export type LoginResponse = z.infer<typeof loginResponseSchema>['data']
