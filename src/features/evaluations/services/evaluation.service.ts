import { z } from 'zod'
import { envelopeSchema, paginatedSchema } from '@/shared/lib/api-schema'
import { http, normalizeHttpError } from '@/shared/lib/axios'

export const EVALUATION_STATUSES = [
  'PENDING',
  'SCHEDULED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number]
export type EvaluationFilterStatus = EvaluationStatus | 'OPEN'

export const EVALUATION_STATUS_LABELS: Record<EvaluationFilterStatus, string> =
  {
    OPEN: 'Em aberto (pendentes e agendadas)',
    PENDING: 'Pendente',
    SCHEDULED: 'Agendada',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    CANCELLED: 'Cancelada',
  }

const namedSchema = z.object({ id: z.string(), name: z.string() })
const teacherSchema = z
  .object({ id: z.string(), user: z.object({ name: z.string() }).optional() })
  .nullable()
  .optional()

const evaluationSchema = z.object({
  id: z.string(),
  status: z.enum(EVALUATION_STATUSES),
  scheduledAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  notes: z.string().nullable().optional(),
  certificateUrl: z.string().nullable().optional(),
  practitioner: z
    .object({
      id: z.string(),
      user: z
        .object({ name: z.string(), email: z.string().optional() })
        .optional(),
    })
    .optional(),
  currentBelt: namedSchema.nullable().optional(),
  targetBelt: namedSchema.nullable().optional(),
  teacher: teacherSchema,
  class: z
    .object({
      id: z.string(),
      type: z.string().optional(),
      startsAt: z.string(),
      caveUnit: z.object({ name: z.string() }).optional(),
      teacher: teacherSchema,
    })
    .nullable()
    .optional(),
})

export type Evaluation = z.infer<typeof evaluationSchema>

const listResponseSchema = envelopeSchema(paginatedSchema(evaluationSchema))
const itemResponseSchema = envelopeSchema(evaluationSchema)

export const EVALUATIONS_PAGE_SIZE = 20

export type EvaluationFilters = {
  caveId?: string
  teacherId?: string
  date?: string
  status?: EvaluationFilterStatus
  page?: number
}

export type EvaluationPage = {
  items: Evaluation[]
  page: number
  totalPages: number
  total: number
}

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Teacher responsible for approving: the teacher of the scheduled class. */
export function classTeacherId(evaluation: Evaluation): string | null {
  return evaluation.class?.teacher?.id ?? evaluation.teacher?.id ?? null
}

async function patch(path: string, body: object): Promise<Evaluation> {
  try {
    const { data } = await http.patch<unknown>(path, body)
    return itemResponseSchema.parse(data).data
  } catch (error) {
    throw normalizeHttpError(error)
  }
}

/** One page of the validation queue, as returned by the API (`_meta`). */
export async function listEvaluations(
  filters: EvaluationFilters,
  signal?: AbortSignal,
): Promise<EvaluationPage> {
  try {
    // The API rejects empty strings, so only filled filters are sent.
    const params = Object.fromEntries(
      Object.entries({
        ...filters,
        page: filters.page ?? 1,
        limit: EVALUATIONS_PAGE_SIZE,
      }).filter(([, value]) => value !== undefined && value !== ''),
    )
    const { data } = await http.get<unknown>('/belt-validations', {
      params,
      signal,
    })
    const page = listResponseSchema.parse(data).data
    return {
      items: page.data,
      page: page._meta.page,
      totalPages: page._meta.totalPage,
      total: page._meta.total,
    }
  } catch (error) {
    throw normalizeHttpError(error)
  }
}

export function scheduleEvaluation(id: string, classId: string) {
  return patch(`/belt-validations/${id}/schedule`, { classId })
}

export function approveEvaluation(
  id: string,
  input: { approvedBeltId?: string; notes?: string } = {},
) {
  return patch(`/belt-validations/${id}/approve`, {
    ...(input.approvedBeltId ? { approvedBeltId: input.approvedBeltId } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  })
}

export function rejectEvaluation(
  id: string,
  input: { suggestedBeltId: string; notes?: string },
) {
  return patch(`/belt-validations/${id}/reject`, {
    suggestedBeltId: input.suggestedBeltId,
    ...(input.notes ? { notes: input.notes } : {}),
  })
}

export function cancelEvaluation(id: string) {
  return patch(`/belt-validations/${id}/cancel`, {})
}
