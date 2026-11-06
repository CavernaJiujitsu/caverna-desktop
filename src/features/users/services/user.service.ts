import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
})

export type User = z.infer<typeof userSchema>

const listResponseSchema = z.object({
  data: z.object({
    data: z.array(userSchema),
    _meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
    }),
  }),
})

const itemResponseSchema = z.object({
  data: userSchema,
})

const ENDPOINTS = {
  list: '/users',
  item: (id: string) => `/users/${id}`,
} as const

export const userService = {
  async list(signal?: AbortSignal): Promise<User[]> {
    try {
      const response = await http.get(ENDPOINTS.list, {
        params: { page: 1, limit: 100 },
        signal,
      })
      return listResponseSchema.parse(response.data).data.data
    } catch {
      throw new AppError('unknown', 'Falha ao listar usuários.')
    }
  },

  async findOne(id: string, signal?: AbortSignal): Promise<User> {
    try {
      const response = await http.get(ENDPOINTS.item(id), { signal })
      return itemResponseSchema.parse(response.data).data
    } catch {
      throw new AppError('not-found', 'Usuário não encontrado.')
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await http.delete(ENDPOINTS.item(id))
    } catch {
      throw new AppError('unknown', 'Falha ao remover usuário.')
    }
  },
}
