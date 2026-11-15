import { z } from 'zod'

export const SCHEDULE_DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
] as const

export const SCHEDULE_SCOPES = ['single', 'all'] as const
export type ScheduleScope = (typeof SCHEDULE_SCOPES)[number]

const uuid = z.string().uuid('Informe um UUID válido.')
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/

const time = z.string().regex(timePattern, 'Use o formato HH:mm (24 horas).')
const date = z
  .string()
  .regex(datePattern, 'Use uma data no formato AAAA-MM-DD.')
export const scheduleSchema = z
  .object({
    id: uuid,
    caveUnitId: uuid,
    teacherId: uuid,
    title: z.string().min(1),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    dayOfWeek: z.number().int().min(0).max(6),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    capacity: z.number().int().min(1),
    active: z.boolean(),
    caveUnit: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .passthrough()
      .optional(),
    teacher: z
      .object({
        id: z.string(),
        userId: z.string().optional(),
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export type ClassSchedule = z.infer<typeof scheduleSchema>

const scheduleFields = {
  title: z.string().trim().min(1, 'Informe um título.').max(120),
  dayOfWeek: z
    .number('Escolha um dia da semana.')
    .int('Escolha um dia da semana.')
    .min(0)
    .max(6),
  startsAt: time,
  endsAt: time,
  startDate: date,
  endDate: date,
  capacity: z
    .number('Informe a capacidade.')
    .int('Informe um número inteiro.')
    .min(1, 'A capacidade mínima é 1.'),
} as const

function refinePeriod(
  values: {
    startsAt: string
    endsAt: string
    startDate: string
    endDate: string
  },
  context: z.RefinementCtx,
) {
  if (values.startsAt && values.endsAt && values.startsAt >= values.endsAt) {
    context.addIssue({
      code: 'custom',
      path: ['endsAt'],
      message: 'O término deve ser depois do início.',
    })
  }
  if (values.startDate && values.endDate && values.startDate > values.endDate) {
    context.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'O fim do período deve ser depois do início.',
    })
  }
}

export const createScheduleSchema = z
  .object({
    caveUnitId: uuid,
    teacherId: uuid,
    ...scheduleFields,
    active: z.boolean().optional(),
  })
  .superRefine(refinePeriod)

export const updateScheduleSchema = z
  .object({
    ...scheduleFields,
    active: z.boolean(),
    scope: z.enum(SCHEDULE_SCOPES),
  })
  .superRefine(refinePeriod)

// Shared UI schema so the same form can create and edit a schedule.
export const scheduleFormSchema = z
  .object({
    caveUnitId: uuid,
    teacherId: uuid,
    ...scheduleFields,
    active: z.boolean(),
    scope: z.enum(SCHEDULE_SCOPES),
  })
  .superRefine(refinePeriod)

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>
export type ScheduleFormValues = z.input<typeof scheduleFormSchema>
export type ScheduleFormOutput = z.output<typeof scheduleFormSchema>

export const scheduleUpdateResultSchema = z.object({
  scope: z.enum(SCHEDULE_SCOPES),
  updated: z.number().int().nonnegative(),
  schedules: z.array(scheduleSchema),
})

export type ScheduleUpdateResult = z.infer<typeof scheduleUpdateResultSchema>

export function timeFromSchedule(value: string): string {
  const iso = new Date(value)
  if (Number.isNaN(iso.getTime())) return value.slice(0, 5)
  return iso.toISOString().slice(11, 16)
}

export function dateFromSchedule(value: string): string {
  return value.slice(0, 10)
}

export function formatScheduleTime(value: string): string {
  return timeFromSchedule(value)
}

export function formatScheduleDate(value: string): string {
  const iso = dateFromSchedule(value)
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}
