import { z } from 'zod'

export const classTypeSchema = z.enum(['regular', 'validation', 'exam'])
export const beltSchema = z.enum(['white', 'blue', 'purple', 'brown', 'black'])

export const enrollmentSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  belt: beltSchema.nullable(),
  status: z.enum(['reserved', 'confirmed', 'cancelled']),
  enrolledAt: z.string(),
})

export const classSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  unitName: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  date: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  capacity: z.number().int().positive(),
  type: classTypeSchema,
  eligibleBelts: z.array(beltSchema),
  movements: z.array(z.object({ id: z.string(), name: z.string() })),
  enrollments: z.array(enrollmentSchema),
})

export const classInputSchema = z.object({
  unitId: z.string().min(1, 'Selecione uma unidade.'),
  teacherId: z.string().min(1, 'Selecione um professor.'),
  date: z.string().min(1, 'Informe a data.'),
  startsAt: z.string().min(1, 'Informe o início.'),
  endsAt: z.string().min(1, 'Informe o fim.'),
  capacity: z.coerce.number().int().min(1, 'A capacidade deve ser maior que zero.'),
  type: classTypeSchema,
  eligibleBelts: z.array(beltSchema).min(1, 'Selecione ao menos uma faixa.'),
  movementIds: z.array(z.string()),
})

export type AcademyClass = z.infer<typeof classSchema>
export type ClassInput = z.infer<typeof classInputSchema>
export type Enrollment = z.infer<typeof enrollmentSchema>
