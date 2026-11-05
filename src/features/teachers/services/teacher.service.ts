import { z } from 'zod'
import { http } from '@/shared/lib/axios'

const teacherSchema = z.object({ id: z.string().uuid(), name: z.string() })
const responseSchema = z.object({ data: z.array(teacherSchema) })

export type TeacherOption = z.infer<typeof teacherSchema>

export async function listTeachers(signal?: AbortSignal): Promise<TeacherOption[]> {
  const response = await http.get('/teachers', { signal })
  return responseSchema.parse(response.data).data
}
