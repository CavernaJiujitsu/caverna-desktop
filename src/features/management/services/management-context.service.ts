import { z } from 'zod'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'
import type { ManagementContext } from '@/shared/types/management-context'

const ENDPOINTS = {
  list: '/api/v1/management/contexts',
  switch: '/api/v1/management/contexts/switch',
} as const

const base = { id: z.string().uuid(), label: z.string(), detail: z.string() }
const contextSchema = z.discriminatedUnion('role', [
  z.object({ ...base, role: z.literal('platform') }),
  z.object({ ...base, role: z.literal('academy'), caveId: z.string().uuid() }),
  z.object({
    ...base,
    role: z.literal('teacher'),
    caveId: z.string().uuid(),
    caveUnitId: z.string().uuid(),
    teacherId: z.string().uuid(),
  }),
])
const contextListResponseSchema = z.object({ data: z.array(contextSchema) })
const contextResponseSchema = z.object({ data: contextSchema })

export const managementContextService = {
  async list(signal?: AbortSignal): Promise<ManagementContext[]> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.list, { signal })
      return contextListResponseSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async switch(contextId: string): Promise<ManagementContext> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.switch, { contextId })
      const context = contextResponseSchema.parse(data).data
      if (context.id !== contextId)
        throw new AppError(
          'forbidden',
          'Não foi possível validar o contexto selecionado.',
          403,
        )
      return context
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
