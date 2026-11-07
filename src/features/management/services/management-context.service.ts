import { z } from 'zod'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import type { ManagementContext } from '@/shared/types/management-context'

// CONTRACT PENDING #98: the backend does not expose management contexts yet.
// Callers must treat failures as recoverable and use the local fallback below.
const ENDPOINTS = {
  list: '/api/v1/management/contexts',
  switch: '/api/v1/management/contexts/switch',
} as const

const contextSchema = z.object({
  id: z.string(),
  role: z.enum(['platform', 'academy', 'teacher']),
  label: z.string(),
  detail: z.string().optional(),
})

const contextListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(contextSchema),
  timestamp: z.string().optional(),
})

export const managementContextService = {
  async list(): Promise<ManagementContext[]> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.list)
      return contextListResponseSchema.parse(data).data.map((context) => ({
        id: context.id,
        role: context.role,
        label: context.label,
        detail: context.detail ?? '',
      }))
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async switch(contextId: string): Promise<void> {
    try {
      await http.post(ENDPOINTS.switch, { contextId })
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}

// Temporary local context so authenticated management screens remain usable
// until #98 exposes authorized contexts. It grants no backend permission.
export function buildLocalFallbackContext(userId: string): ManagementContext {
  return {
    id: `local:${userId}`,
    role: 'academy',
    label: 'Gestão da academia',
    detail: 'Contexto local até a API de contextos ser disponibilizada.',
  }
}
