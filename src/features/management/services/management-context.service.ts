import { z } from 'zod'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import { envelopeSchema } from '@/shared/lib/api-schema'
import { AppError } from '@/shared/types/app-error'
import type { ManagementContext } from '@/shared/types/management-context'

const ENDPOINTS = {
  list: '/management/contexts',
  switch: '/management/contexts/switch',
} as const

const contextSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['platform', 'academy', 'teacher']),
  label: z.string().min(1),
  detail: z.string().optional(),
  caveId: z.string().uuid().optional(),
})

const contextListResponseSchema = envelopeSchema(z.array(contextSchema))
const contextResponseSchema = envelopeSchema(contextSchema)

function toContext(context: z.infer<typeof contextSchema>): ManagementContext {
  return {
    id: context.id,
    role: context.role,
    label: context.label,
    detail: context.detail ?? '',
    caveId: context.caveId,
  }
}

export const managementContextService = {
  async list(signal?: AbortSignal): Promise<ManagementContext[]> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.list, { signal })
      return contextListResponseSchema.parse(data).data.map(toContext)
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async switch(contextId: string): Promise<ManagementContext> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.switch, {
        contextId,
      })
      const context = toContext(contextResponseSchema.parse(data).data)
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
