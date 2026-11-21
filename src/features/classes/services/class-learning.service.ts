import { z } from 'zod'
import { envelopeSchema } from '@/shared/lib/api-schema'
import { http } from '@/shared/lib/axios'

const taught = z.object({
  trailStageMovement: z.object({ id: z.string().uuid() }),
})

export const classLearningService = {
  async content(classId: string): Promise<string[]> {
    const { data } = await http.get<unknown>(`/classes/${classId}/content`)
    return envelopeSchema(z.array(taught)).parse(data).data.map((item) => item.trailStageMovement.id)
  },
  async replace(classId: string, trailStageMovementIds: string[]) {
    await http.put(`/classes/${classId}/content`, { trailStageMovementIds })
  },
  async validate(classId: string, enrollmentId: string, movementId: string) {
    await http.post(`/classes/${classId}/enrollments/${enrollmentId}/movements/${movementId}/validate`)
  },
  async exam(classId: string, enrollmentId: string, decision: 'approve' | 'reject') {
    await http.post(`/classes/${classId}/enrollments/${enrollmentId}/exam/${decision}`)
  },
}
