import { z } from 'zod'

const uuid = z.string().uuid('Informe um UUID válido.')

export const teacherSchema = z
  .object({
    id: uuid,
    name: z.string(),
    email: z.email().optional(),
    caveUnitIds: z.array(uuid).optional(),
  })
  .passthrough()

export const teacherCreateSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe uma senha inicial.'),
  caveUnitIds: z
    .array(
      z.object({
        caveUnitId: uuid,
        caveName: z.string().trim().min(1),
      }),
    )
    .optional(),
})

export const teacherUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome.').optional(),
    email: z.email('Informe um e-mail válido.').optional(),
    caveUnitIds: z.array(uuid).optional(),
  })
  .refine(
    (values) =>
      values.name !== undefined ||
      values.email !== undefined ||
      values.caveUnitIds !== undefined,
    'Informe ao menos um campo para atualizar.',
  )

export const teacherUnitLinkSchema = z.object({ caveUnitId: uuid })

export type Teacher = z.infer<typeof teacherSchema>
export type TeacherCreateInput = z.infer<typeof teacherCreateSchema>
export type TeacherUpdateInput = z.infer<typeof teacherUpdateSchema>
