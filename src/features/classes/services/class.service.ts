import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import {
  classInputSchema,
  classSchema,
  type AcademyClass,
  type ClassInput,
  type Enrollment,
} from '@/features/classes/schemas/class.schema'

const apiClassSchema = z.object({
  id: z.string(),
  type: z.enum(['SCHEDULED', 'VALIDATION', 'EXAM']),
  startsAt: z.string(),
  endsAt: z.string(),
  capacity: z.number(),
  caveUnit: z.object({ id: z.string(), name: z.string() }).optional(),
  teacher: z
    .object({ id: z.string(), user: z.object({ name: z.string() }).optional() })
    .optional(),
  belts: z.array(z.object({ belt: z.object({ name: z.string() }) })).optional(),
  enrollments: z
    .array(
      z.object({
        id: z.string(),
        practitioner: z
          .object({ user: z.object({ name: z.string() }).optional() })
          .optional(),
        status: z.string(),
        createdAt: z.string(),
      }),
    )
    .optional(),
})
const listResponseSchema = z.object({
  data: z.object({ data: z.array(apiClassSchema) }),
})
const itemResponseSchema = z.object({ data: apiClassSchema })
export type ClassFilters = { unitId: string; date: string; teacherId?: string }
function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}
function toClass(item: z.infer<typeof apiClassSchema>): AcademyClass {
  return classSchema.parse({
    id: item.id,
    unitId: item.caveUnit?.id ?? '',
    unitName: item.caveUnit?.name ?? 'Unidade não informada',
    teacherId: item.teacher?.id ?? '',
    teacherName: item.teacher?.user?.name ?? 'Professor não informado',
    date: item.startsAt.slice(0, 10),
    startsAt: new Date(item.startsAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    endsAt: new Date(item.endsAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    capacity: item.capacity,
    type: { SCHEDULED: 'regular', VALIDATION: 'validation', EXAM: 'exam' }[
      item.type
    ],
    eligibleBelts: (item.belts ?? []).map(
      ({ belt }) =>
        belt.name.toLowerCase() as AcademyClass['eligibleBelts'][number],
    ),
    movements: [],
    enrollments: (item.enrollments ?? []).map((e) => ({
      id: e.id,
      studentName: e.practitioner?.user?.name ?? 'Aluno não informado',
      belt: null,
      status:
        e.status === 'CONFIRMED'
          ? 'confirmed'
          : e.status === 'CANCELLED'
            ? 'cancelled'
            : 'reserved',
      enrolledAt: e.createdAt,
    })),
  })
}
function typeOf(value: ClassInput['type']) {
  return { regular: 'SCHEDULED', validation: 'VALIDATION', exam: 'EXAM' }[value]
}

const enrollmentItemSchema = z.object({
  id: z.string(),
  practitionerId: z.string(),
  practitioner: z
    .object({ user: z.object({ name: z.string() }).optional() })
    .optional(),
  status: z.string(),
  createdAt: z.string(),
})
const enrollmentsResponseSchema = z.object({
  data: z.object({ data: z.array(enrollmentItemSchema) }),
})

const classEnrollmentDtoSchema = z.object({
  practitionerId: z.string().uuid(),
})

export const classService = {
  async list(filters: ClassFilters, signal?: AbortSignal) {
    const response = await http.get('/classes', {
      params: {
        page: 1,
        limit: 100,
        caveUnitId: filters.unitId || undefined,
        teacherId: filters.teacherId || undefined,
      },
      signal,
    })
    const items = listResponseSchema.parse(response.data).data.data.map(toClass)
    return filters.date
      ? items.filter((item) => item.date === filters.date)
      : items
  },
  async findOne(id: string, signal?: AbortSignal) {
    const response = await http.get(`/classes/${id}`, { signal })
    return toClass(itemResponseSchema.parse(response.data).data)
  },
  async create(input: ClassInput) {
    const p = classInputSchema.parse(input)
    const response = await http.post('/classes', {
      caveUnitId: p.unitId,
      teacherId: p.teacherId,
      type: typeOf(p.type),
      startsAt: toIso(p.date, p.startsAt),
      endsAt: toIso(p.date, p.endsAt),
      capacity: p.capacity,
      beltIds: [],
    })
    return toClass(itemResponseSchema.parse(response.data).data)
  },
  async update(id: string, input: ClassInput) {
    const p = classInputSchema.parse(input)
    const response = await http.patch(`/classes/${id}`, {
      type: typeOf(p.type),
      startsAt: toIso(p.date, p.startsAt),
      endsAt: toIso(p.date, p.endsAt),
      capacity: p.capacity,
      teacherId: p.teacherId,
    })
    return toClass(itemResponseSchema.parse(response.data).data)
  },
  async remove(id: string) {
    await http.delete(`/classes/${id}`)
  },
  async replaceBelts(id: string, beltIds: string[]) {
    const response = await http.put(`/classes/${id}/belts`, { beltIds })
    return toClass(itemResponseSchema.parse(response.data).data)
  },
  async enroll(classId: string, practitionerId: string) {
    await http.post(
      `/classes/${classId}/enrollments`,
      classEnrollmentDtoSchema.parse({ practitionerId }),
    )
  },
  async listEnrollments(
    classId: string,
    signal?: AbortSignal,
  ): Promise<Enrollment[]> {
    const response = await http.get(`/classes/${classId}/enrollments`, {
      params: { page: 1, limit: 100 },
      signal,
    })
    const items = enrollmentsResponseSchema.parse(response.data).data.data
    return items.map((e) => ({
      id: e.id,
      studentName: e.practitioner?.user?.name ?? 'Aluno não informado',
      belt: null,
      status:
        e.status === 'CONFIRMED'
          ? 'confirmed'
          : e.status === 'CANCELLED'
            ? 'cancelled'
            : 'reserved',
      enrolledAt: e.createdAt,
    }))
  },
  async checkIn(classId: string, enrollmentId: string) {
    await http.post(`/classes/${classId}/enrollments/${enrollmentId}/check-in`)
  },
  async setParticipation(
    classId: string,
    enrollmentId: string,
    startedAt: string,
    endedAt: string,
    pauses: { startedAt: string; endedAt: string }[] = [],
    reason?: string,
  ) {
    await http.patch(
      `/classes/${classId}/enrollments/${enrollmentId}/participation`,
      { startedAt, endedAt, pauses, ...(reason ? { reason } : {}) },
    )
  },
  async cancel(classId: string, enrollmentId: string) {
    await http.post(`/classes/${classId}/enrollments/${enrollmentId}/cancel`)
  },
}
