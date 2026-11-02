import { z } from 'zod'

// CONTRACT PENDING #78/#98: confirm the exact response shape with the
// authentication integration owner before pointing at a real backend.
export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
})

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authUserSchema,
})

export type AuthUser = z.infer<typeof authUserSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
