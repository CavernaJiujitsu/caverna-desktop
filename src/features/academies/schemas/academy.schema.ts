import { z } from 'zod'

import {
  unitSchema,
  type AcademyUnit,
} from '@/features/academies/schemas/unit.schema'

export { unitSchema }

export const academySchema = z.object({
  id: z.string(),
  name: z.string(),
  units: z.array(unitSchema).default([]),
})
export type Academy = z.infer<typeof academySchema>
export type { AcademyUnit }
