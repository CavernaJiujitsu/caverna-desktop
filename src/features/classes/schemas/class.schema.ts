import { z } from 'zod'

export const CLASS_TYPES = ['SCHEDULED', 'VALIDATION', 'EXAM'] as const
export type ClassType = (typeof CLASS_TYPES)[number]

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  SCHEDULED: 'Regular',
  VALIDATION: 'Validação',
  EXAM: 'Exame',
}

export const ENROLLMENT_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'CONFIRMED',
  'EXPIRED',
  'CANCELLED',
] as const
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number]

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING: 'Inscrito',
  IN_PROGRESS: 'Em andamento',
  CONFIRMED: 'Presença confirmada',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
}

/**
 * Teacher summary embedded in training responses. Contract C1:
 * `{ id, user: { id, name } }`; only the fields the UI reads are parsed.
 * Before C1 the API sends only the teacher audit fields, so `user` stays
 * optional and the UI falls back to "Professor não informado".
 */
export const apiTeacherSummarySchema = z.object({
  id: z.string(),
  user: z.object({ name: z.string() }).nullish(),
})

export const TEACHER_NAME_FALLBACK = 'Professor não informado'

/** Raw class returned by GET /classes and GET /classes/:id. */
export const apiClassSchema = z.object({
  id: z.string(),
  attendanceClosedAt: z.string().nullish(),
  type: z.enum(CLASS_TYPES),
  startsAt: z.string(),
  endsAt: z.string(),
  capacity: z.number(),
  enrolledCount: z.number().optional(),
  caveUnit: z
    .object({
      id: z.string(),
      name: z.string(),
      cave: z.object({ id: z.string(), name: z.string() }).optional(),
    })
    .optional(),
  teacher: apiTeacherSummarySchema.nullish(),
  belts: z
    .array(z.object({ belt: z.object({ id: z.string(), name: z.string() }) }))
    .optional(),
})

/** Class shape consumed by the UI. */
export type ClassItem = {
  id: string
  attendanceClosedAt?: string | null
  type: ClassType
  startsAt: string
  endsAt: string
  capacity: number
  enrolledCount?: number
  caveUnitId: string
  caveUnitName: string
  caveName: string | null
  teacherId: string
  /** `teacher.user.name` (contract C1); `null` when the API omits the user. */
  teacherName: string | null
  belts: { id: string; name: string }[]
}

export const apiEnrollmentSchema = z.object({
  id: z.string(),
  status: z.enum(ENROLLMENT_STATUSES),
  expiresAt: z.string().nullable().optional(),
  confirmedAt: z.string().nullable().optional(),
  practitioner: z
    .object({
      id: z.string(),
      user: z
        .object({ name: z.string(), email: z.string().optional() })
        .optional(),
    })
    .optional(),
})

export type Enrollment = {
  id: string
  status: EnrollmentStatus
  confirmedAt: string | null
  practitionerId: string
  studentName: string
  studentEmail: string | null
}

const timePattern = /^\d{2}:\d{2}$/

export const classFormSchema = z
  .object({
    caveUnitId: z.string().min(1, 'Selecione uma unidade.'),
    teacherId: z.string().min(1, 'Selecione um professor.'),
    type: z.enum(CLASS_TYPES),
    date: z.string().min(1, 'Informe a data.'),
    startTime: z.string().regex(timePattern, 'Informe o início.'),
    endTime: z.string().regex(timePattern, 'Informe o fim.'),
    capacity: z
      .number({ error: 'Informe a capacidade.' })
      .int('Use um número inteiro.')
      .min(1, 'A capacidade deve ser maior que zero.'),
    beltIds: z.array(z.string()),
  })
  .refine((values) => values.endTime > values.startTime, {
    message: 'O fim deve ser depois do início.',
    path: ['endTime'],
  })

export type ClassFormValues = z.infer<typeof classFormSchema>

export const participationFormSchema = z
  .object({
    startTime: z.string().regex(timePattern, 'Informe o início.'),
    endTime: z.string().regex(timePattern, 'Informe o fim.'),
    reason: z.string().trim().max(500),
  })
  .refine((values) => values.endTime > values.startTime, {
    message: 'O fim deve ser depois do início.',
    path: ['endTime'],
  })

export type ParticipationFormValues = z.infer<typeof participationFormSchema>
