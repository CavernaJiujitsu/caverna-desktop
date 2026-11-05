import { z } from 'zod'

export const unitSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
})
export const academyInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name')
    .max(100, 'Use 100 characters or fewer'),
})
export type AcademyInput = z.infer<typeof academyInputSchema>
export const academySchema = academyInputSchema.extend({ id: z.string(), units: z.array(unitSchema).default([]) })
export type Academy = z.infer<typeof academySchema>
export type AcademyUnit = z.infer<typeof unitSchema>
