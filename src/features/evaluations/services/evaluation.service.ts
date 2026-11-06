import { z } from 'zod'
import { http } from '@/shared/lib/axios'

const evaluationSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'SCHEDULED', 'APPROVED', 'REJECTED', 'CANCELLED']),
  scheduledAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  teacher: z
    .object({ id: z.string(), user: z.object({ name: z.string() }).optional() })
    .nullable()
    .optional(),
  practitioner: z
    .object({ user: z.object({ name: z.string() }).optional() })
    .optional(),
  targetBelt: z.object({ name: z.string() }).optional(),
  class: z
    .object({
      startsAt: z.string(),
      caveUnit: z.object({ name: z.string() }).optional(),
    })
    .nullable()
    .optional(),
})

const responseSchema = z.object({
  data: z.object({ data: z.array(evaluationSchema) }),
})

export type EvaluationFilters = { date: string; teacherId: string }
export type Evaluation = z.infer<typeof evaluationSchema>

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function listEvaluations(
  filters: EvaluationFilters,
  signal?: AbortSignal,
) {
  const response = await http.get('/belt-validations', {
    params: {
      page: 1,
      limit: 100,
      date: filters.date || undefined,
      teacherId: filters.teacherId || undefined,
    },
    signal,
  })
  return responseSchema.parse(response.data).data.data
}

const mutationResponseSchema = z.object({ data: evaluationSchema })

export async function approveEvaluation(id: string, signal?: AbortSignal) {
  const response = await http.patch(
    `/belt-validations/${id}/approve`,
    {},
    { signal },
  )
  return mutationResponseSchema.parse(response.data).data
}

export async function rejectEvaluation(
  id: string,
  suggestedBeltId: string,
  notes?: string,
  signal?: AbortSignal,
) {
  const response = await http.patch(
    `/belt-validations/${id}/reject`,
    { suggestedBeltId, ...(notes ? { notes } : {}) },
    { signal },
  )
  return mutationResponseSchema.parse(response.data).data
}

export async function scheduleEvaluation(
  id: string,
  classId: string,
  signal?: AbortSignal,
) {
  const response = await http.patch(
    `/belt-validations/${id}/schedule`,
    { classId },
    { signal },
  )
  return mutationResponseSchema.parse(response.data).data
}

export async function cancelEvaluation(id: string, signal?: AbortSignal) {
  const response = await http.patch(
    `/belt-validations/${id}/cancel`,
    {},
    { signal },
  )
  return mutationResponseSchema.parse(response.data).data
}
