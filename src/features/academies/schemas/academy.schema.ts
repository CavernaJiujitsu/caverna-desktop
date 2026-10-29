import { z } from 'zod'

// Demo-only UI validation; no backend domain constraints are asserted here.
export const academyInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name')
    .max(100, 'Use 100 characters or fewer'),
})
export type AcademyInput = z.infer<typeof academyInputSchema>
export const academySchema = academyInputSchema.extend({ id: z.string() })
export type Academy = z.infer<typeof academySchema>
