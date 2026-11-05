import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import { academySchema, type Academy, type AcademyInput } from '@/features/academies/schemas/academy.schema'

const listResponse = z.object({ data: z.object({ data: z.array(z.object({ id: z.string(), name: z.string() })) }) })
const itemResponse = z.object({ data: z.object({ id: z.string(), name: z.string() }) })

export const academyService = {
  async list(signal?: AbortSignal): Promise<Academy[]> {
    const response = await http.get('/caves', { params: { page: 1, limit: 100 }, signal })
    return listResponse.parse(response.data).data.data.map((item) => academySchema.parse(item))
  },
  async create(input: AcademyInput, signal?: AbortSignal): Promise<Academy> {
    const response = await http.post('/caves', input, { signal })
    return academySchema.parse(itemResponse.parse(response.data).data)
  },
}
