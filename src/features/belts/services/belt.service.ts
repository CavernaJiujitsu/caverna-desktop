import { z } from 'zod'
import { envelopeSchema, paginatedSchema } from '@/shared/lib/api-schema'
import { http, normalizeHttpError } from '@/shared/lib/axios'

const beltSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string().optional(),
  level: z.number().int(),
})

export type Belt = z.infer<typeof beltSchema>

const listResponseSchema = envelopeSchema(paginatedSchema(beltSchema))

export const beltService = {
  /** Belts are a small public catalog; one page holds all of them. */
  async list(signal?: AbortSignal): Promise<Belt[]> {
    try {
      const { data } = await http.get<unknown>('/belts', {
        params: { page: 1, limit: 100 },
        signal,
      })
      return listResponseSchema
        .parse(data)
        .data.data.slice()
        .sort((a, b) => a.level - b.level)
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
