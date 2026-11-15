import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

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

export type EvaluationFilters = {
  caveId: string
  date: string
  teacherId: string
  status?: 'PENDING' | 'SCHEDULED'
}
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
      caveId: filters.caveId || undefined,
      date: filters.date || undefined,
      teacherId: filters.teacherId || undefined,
      status: filters.status,
    },
    signal,
  })
  return responseSchema.parse(response.data).data.data
}

const mutationResponseSchema = z.object({ data: evaluationSchema })

const itemResponseSchema = z.object({ data: evaluationSchema })

export async function createEvaluation(
  input: { targetBeltId?: string; certificateUrl?: string; classId?: string },
  signal?: AbortSignal,
) {
  const response = await http.post('/belt-validations', input, { signal })
  return itemResponseSchema.parse(response.data).data
}

export async function findEvaluation(id: string, signal?: AbortSignal) {
  try {
    const response = await http.get(`/belt-validations/${id}`, { signal })
    return itemResponseSchema.parse(response.data).data
  } catch {
    throw new AppError('not-found', 'Validação de faixa não encontrada.')
  }
}

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
