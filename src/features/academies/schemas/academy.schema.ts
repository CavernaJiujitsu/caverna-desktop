import { z } from 'zod'

import {
  unitSchema,
  type AcademyUnit,
} from '@/features/academies/schemas/unit.schema'

export { unitSchema }

export const academyInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name')
    .max(100, 'Use 100 characters or fewer'),
})
export type AcademyInput = z.infer<typeof academyInputSchema>
export const academySchema = academyInputSchema.extend({
  id: z.string(),
  units: z.array(unitSchema).default([]),
})
export type Academy = z.infer<typeof academySchema>
export type { AcademyUnit }
