import { z } from 'zod'
import { http } from '@/shared/lib/axios'

const entryResultSchema = z.object({
  data: z.object({
    enrollmentId: z.string().uuid(),
    classId: z.string().uuid(),
    studentName: z.string(),
    verifiedAt: z.string(),
  }),
})

export async function verifyEntry(code: string) {
  const { data } = await http.post('/entries/verify', { code })
  return entryResultSchema.parse(data).data
}
