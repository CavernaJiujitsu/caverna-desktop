import { z } from 'zod'

// The backend wraps every success response in { message, data, timestamp }.
export const loginResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    accessToken: z.string().min(1),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int().positive(),
    userId: z.string().uuid(),
    practitionerId: z.string().uuid(),
  }),
  timestamp: z.string().optional(),
})

export type LoginResponse = z.infer<typeof loginResponseSchema>['data']
