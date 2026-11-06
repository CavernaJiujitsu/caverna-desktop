import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

const beltSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  level: z.number().int().positive(),
})

export type Belt = z.infer<typeof beltSchema>

const listResponseSchema = z.object({
  data: z.object({
    data: z.array(beltSchema),
    _meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
    }),
  }),
})

const itemResponseSchema = z.object({
  data: beltSchema,
})

const ENDPOINTS = {
  list: '/belts',
  item: (id: string) => `/belts/${id}`,
} as const

export const beltService = {
  async list(signal?: AbortSignal): Promise<Belt[]> {
    try {
      const response = await http.get(ENDPOINTS.list, {
        params: { page: 1, limit: 100 },
        signal,
      })
      return listResponseSchema.parse(response.data).data.data
    } catch {
      throw new AppError('unknown', 'Falha ao listar faixas.')
    }
  },

  async findOne(id: string, signal?: AbortSignal): Promise<Belt> {
    try {
      const response = await http.get(ENDPOINTS.item(id), { signal })
      return itemResponseSchema.parse(response.data).data
    } catch {
      throw new AppError('not-found', 'Faixa não encontrada.')
    }
  },
}
