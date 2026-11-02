import { http } from '@/shared/lib/axios'
import { z } from 'zod'
import type { ManagementContext } from '@/shared/types/management-context'

// CONTRACT PENDING #78/#98: confirm these endpoints with the management
// authorization owner (#98) before connecting to a real backend.
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

export const managementContextService = {
  async list(): Promise<ManagementContext[]> {
    const { data } = await http.get<unknown>(ENDPOINTS.list)
    const parsed = z.array(contextSchema).parse(data)
    return parsed.map((context) => ({
      id: context.id,
      role: context.role,
      label: context.label,
      detail: context.detail ?? '',
    }))
  },

  async switch(contextId: string): Promise<void> {
    await http.post(ENDPOINTS.switch, { contextId })
  },
}
