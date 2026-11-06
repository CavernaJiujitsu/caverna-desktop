import { z } from 'zod'

export const practitionerUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
})

export const practitionerSchema = z.object({
  id: z.string().uuid(),
  user: practitionerUserSchema,
  age: z.number().int().min(0).max(120).nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
})

export type Practitioner = z.infer<typeof practitionerSchema>
export type PractitionerUser = z.infer<typeof practitionerUserSchema>

export type PractitionerInput = {
  name: string
  email: string
  password: string
  age?: number
  latitude?: number
  longitude?: number
}

export type PractitionerUpdateInput = {
  name?: string
  email?: string
  age?: number
  latitude?: number
  longitude?: number
}
