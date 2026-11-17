import { z } from 'zod'
import {
  apiClassSchema,
  type ClassType,
  type EnrollmentStatus,
} from '@/features/classes/schemas/class.schema'
import {
  addDays,
  toDateInputValue,
} from '@/features/classes/services/class-dates'

/** GET /classes item with the seat usage computed by the API. */
export const apiTrainingSchema = apiClassSchema.extend({
  enrolledCount: z.number().int().nonnegative().default(0),
  presentCount: z.number().int().nonnegative().default(0),
})

export type TrainingItem = {
  id: string
  type: ClassType
  startsAt: string
  endsAt: string
  capacity: number
  caveName: string | null
  caveUnitName: string
  teacherName: string | null
  enrolledCount: number
  presentCount: number
}

export type TrainingPage = {
  items: TrainingItem[]
  page: number
  totalPages: number
  total: number
}

/** Short labels for the training roster (FRD treinos-e-alunos §6). */
export const ROSTER_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING: 'Inscrito',
  IN_PROGRESS: 'Em andamento',
  CONFIRMED: 'Presente',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
}

export const MAX_PERIOD_DAYS = 31

export type ResolvedPeriod =
  | { valid: false; error: string }
  | {
      valid: true
      fromDate: string
      /** End date actually queried, at most `MAX_PERIOD_DAYS` after `fromDate`. */
      toDate: string
      /** The chosen end date was beyond the limit and was moved back to it. */
      limited: boolean
    }

function parseDateInput(value: string): Date | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Resolves the period filter (FRD treinos-e-alunos §7). A start after the end
 * blocks the filter; a range longer than `MAX_PERIOD_DAYS` is not blocked; its
 * end date is limited to the maximum. Dates are `YYYY-MM-DD` input values.
 */
export function resolvePeriod(
  fromDate: string,
  toDate: string,
): ResolvedPeriod {
  const from = parseDateInput(fromDate)
  const to = parseDateInput(toDate)
  if (!from || !to)
    return { valid: false, error: 'Informe a data inicial e a final.' }
  if (from > to)
    return { valid: false, error: 'A data inicial deve ser anterior à final.' }
  const maxTo = addDays(from, MAX_PERIOD_DAYS)
  if (to > maxTo)
    return {
      valid: true,
      fromDate,
      toDate: toDateInputValue(maxTo),
      limited: true,
    }
  return { valid: true, fromDate, toDate, limited: false }
}
