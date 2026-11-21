import { z } from 'zod'
import { envelopeSchema } from '@/shared/lib/api-schema'
import { http } from '@/shared/lib/axios'

const movement = z.object({ id: z.string().uuid(), name: z.string(), description: z.string().nullable().optional() })
const association = z.object({ id: z.string().uuid(), position: z.number(), required: z.boolean(), movement })
const stage = z.object({ id: z.string().uuid(), name: z.string(), position: z.number(), movements: z.array(association).optional() })
const trail = z.object({ id: z.string().uuid(), belt: z.object({ id: z.string().uuid() }), stages: z.array(stage).optional() })
const belt = z.object({
  id: z.string().uuid(), name: z.string(), color: z.string(), level: z.number(),
  minimumTrainingMinutes: z.number(), minimumTrainingClasses: z.number(),
})
const catalog = z.object({
  belts: z.array(belt), movements: z.array(movement), trails: z.array(trail),
  minimumPracticeClasses: z.number(),
})
export type Catalog = z.infer<typeof catalog>

export const catalogService = {
  async list(): Promise<Catalog> {
    const { data } = await http.get<unknown>('/graduation-catalog')
    return envelopeSchema(catalog).parse(data).data
  },
  async saveBelt(input: Omit<Catalog['belts'][number], 'id'>, id?: string) {
    if (id) await http.patch(`/graduation-catalog/belts/${id}`, input)
    else await http.post('/graduation-catalog/belts', input)
  },
  async saveStage(beltId: string, input: { name: string; position: number; description?: string }, id?: string) {
    if (id) await http.patch(`/graduation-catalog/belts/${beltId}/stages/${id}`, input)
    else await http.post(`/graduation-catalog/belts/${beltId}/stages`, input)
  },
  async saveMovement(input: { name: string; description?: string }, id?: string) {
    if (id) await http.patch(`/graduation-catalog/movements/${id}`, input)
    else await http.post('/graduation-catalog/movements', input)
  },
  async link(stageId: string, input: { movementId: string; required: boolean; position: number }) {
    await http.post(`/graduation-catalog/stages/${stageId}/movements`, input)
  },
  async setMinimum(minimumPracticeClasses: number) {
    await http.patch('/graduation-catalog/settings', { minimumPracticeClasses })
  },
}
