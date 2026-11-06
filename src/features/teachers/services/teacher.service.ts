import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

const teacherSchema = z.object({ id: z.string().uuid(), name: z.string() })
export type TeacherOption = z.infer<typeof teacherSchema>

const teacherItemSchema = z.object({ data: teacherSchema })
const teachersResponseSchema = z.object({ data: z.array(teacherSchema) })

export type TeacherInput = {
  name: string
  email: string
}

export type TeacherUpdateInput = {
  name?: string
  email?: string
}

export async function listTeachers(
  signal?: AbortSignal,
): Promise<TeacherOption[]> {
  const response = await http.get('/teachers', { signal })
  return teachersResponseSchema.parse(response.data).data
}

export async function findTeacher(
  id: string,
  signal?: AbortSignal,
): Promise<TeacherOption> {
  try {
    const response = await http.get(`/teachers/${id}`, { signal })
    return teacherItemSchema.parse(response.data).data
  } catch {
    throw new AppError('not-found', 'Professor não encontrado.')
  }
}

export async function createTeacher(
  input: TeacherInput,
  signal?: AbortSignal,
): Promise<TeacherOption> {
  try {
    const response = await http.post('/teachers', input, { signal })
    return teacherItemSchema.parse(response.data).data
  } catch {
    throw new AppError('unknown', 'Falha ao criar professor.')
  }
}

export async function updateTeacher(
  id: string,
  input: TeacherUpdateInput,
  signal?: AbortSignal,
): Promise<TeacherOption> {
  try {
    const response = await http.patch(`/teachers/${id}`, input, { signal })
    return teacherItemSchema.parse(response.data).data
  } catch {
    throw new AppError('unknown', 'Falha ao atualizar professor.')
  }
}

export async function removeTeacher(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  try {
    await http.delete(`/teachers/${id}`, { signal })
  } catch {
    throw new AppError('unknown', 'Falha ao remover professor.')
  }
}
