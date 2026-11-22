import { z } from 'zod'

const uuid = z.string().uuid()

export const teacherUnitSchema = z.object({
  id: uuid,
  name: z.string(),
  caveId: uuid,
  caveName: z.string().optional(),
})

export const teacherSchema = z.object({
  id: uuid,
  userId: uuid.optional(),
  name: z.string(),
  email: z.string().email().optional(),
  caveUnits: z.array(teacherUnitSchema).default([]),
})

/** POST /teachers — the account is created together with the profile. */
export type TeacherCreateInput = {
  name: string
  email: string
  password: string
  caveUnitIds?: string[]
}

/** PATCH /teachers/:id — `caveUnitIds` replaces the whole link set. */
export type TeacherUpdateInput = {
  name?: string
  email?: string
  caveUnitIds?: string[]
}

export type Teacher = z.infer<typeof teacherSchema>
export type TeacherUnit = z.infer<typeof teacherUnitSchema>
