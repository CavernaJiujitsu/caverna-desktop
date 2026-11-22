import { envelopeSchema, paginatedSchema } from '@/shared/lib/api-schema'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import {
  apiClassSchema,
  apiEnrollmentSchema,
  type ClassFormValues,
  type ClassItem,
  type ClassType,
  type Enrollment,
} from '@/features/classes/schemas/class.schema'
import { localDateTimeToIso } from '@/features/classes/services/class-dates'
import type { z } from 'zod'

const ENDPOINTS = {
  list: '/classes',
  item: (id: string) => `/classes/${id}`,
  belts: (id: string) => `/classes/${id}/belts`,
  enrollments: (id: string) => `/classes/${id}/enrollments`,
  checkIn: (id: string, enrollmentId: string) =>
    `/classes/${id}/enrollments/${enrollmentId}/check-in`,
  participation: (id: string, enrollmentId: string) =>
    `/classes/${id}/enrollments/${enrollmentId}/participation`,
  cancel: (id: string, enrollmentId: string) =>
    `/classes/${id}/enrollments/${enrollmentId}/cancel`,
} as const

const listResponseSchema = envelopeSchema(paginatedSchema(apiClassSchema))
const itemResponseSchema = envelopeSchema(apiClassSchema)
const enrollmentsResponseSchema = envelopeSchema(
  paginatedSchema(apiEnrollmentSchema),
)

export const CLASSES_PAGE_SIZE = 20

export type ClassListQuery = {
  /** Every unit of the cave; the API ignores it when `caveUnitId` is sent. */
  caveId?: string
  caveUnitId?: string
  teacherId?: string
  type?: ClassType
  /** ISO datetime, inclusive lower bound of `startsAt`. */
  from?: string
  /** ISO datetime, inclusive upper bound of `startsAt`. */
  to?: string
  page?: number
  /** Page size; the API caps it at 100. */
  limit?: number
}

export type ClassPage = {
  items: ClassItem[]
  page: number
  totalPages: number
  total: number
}

export type ParticipationInput = {
  startedAt: string
  endedAt: string
  reason?: string
}

function toClassItem(item: z.infer<typeof apiClassSchema>): ClassItem {
  return {
    id: item.id,
    type: item.type,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    capacity: item.capacity,
    ...(item.enrolledCount !== undefined
      ? { enrolledCount: item.enrolledCount }
      : {}),
    caveUnitId: item.caveUnit?.id ?? '',
    caveUnitName: item.caveUnit?.name ?? 'Unidade não informada',
    caveName: item.caveUnit?.cave?.name ?? null,
    teacherId: item.teacher?.id ?? '',
    teacherName: item.teacher?.user?.name ?? null,
    belts: (item.belts ?? []).map(({ belt }) => ({
      id: belt.id,
      name: belt.name,
    })),
  }
}

function toEnrollment(item: z.infer<typeof apiEnrollmentSchema>): Enrollment {
  return {
    id: item.id,
    status: item.status,
    confirmedAt: item.confirmedAt ?? null,
    practitionerId: item.practitioner?.id ?? '',
    studentName: item.practitioner?.user?.name ?? 'Aluno não informado',
    studentEmail: item.practitioner?.user?.email ?? null,
  }
}

function toClassBody(values: ClassFormValues) {
  return {
    type: values.type,
    startsAt: localDateTimeToIso(values.date, values.startTime),
    endsAt: localDateTimeToIso(values.date, values.endTime),
    capacity: values.capacity,
  }
}

async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (error) {
    throw normalizeHttpError(error)
  }
}

async function fetchClassPage(
  query: ClassListQuery,
  signal?: AbortSignal,
): Promise<ClassPage> {
  // Empty values are omitted: the API rejects empty query strings.
  const params = Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
  const { data } = await http.get<unknown>(ENDPOINTS.list, { params, signal })
  const page = listResponseSchema.parse(data).data
  return {
    items: page.data.map(toClassItem),
    page: page._meta.page,
    totalPages: page._meta.totalPage,
    total: page._meta.total,
  }
}

export const classService = {
  /**
   * First page only (100 by default), for selectors and small windows. Lists
   * that the user browses must use `listPage`, which keeps the API pagination.
   */
  list(query: ClassListQuery, signal?: AbortSignal): Promise<ClassItem[]> {
    return call(async () => {
      const page = await fetchClassPage(
        { ...query, page: query.page ?? 1, limit: query.limit ?? 100 },
        signal,
      )
      return page.items
    })
  },

  /** One page of classes, as returned by the API (`_meta`). */
  listPage(query: ClassListQuery, signal?: AbortSignal): Promise<ClassPage> {
    return call(() =>
      fetchClassPage(
        {
          ...query,
          page: query.page ?? 1,
          limit: query.limit ?? CLASSES_PAGE_SIZE,
        },
        signal,
      ),
    )
  },

  findOne(id: string, signal?: AbortSignal): Promise<ClassItem> {
    return call(async () => {
      const { data } = await http.get<unknown>(ENDPOINTS.item(id), { signal })
      return toClassItem(itemResponseSchema.parse(data).data)
    })
  },

  create(values: ClassFormValues): Promise<ClassItem> {
    return call(async () => {
      const { data } = await http.post<unknown>(ENDPOINTS.list, {
        ...toClassBody(values),
        caveUnitId: values.caveUnitId,
        teacherId: values.teacherId,
        beltIds: values.beltIds,
      })
      return toClassItem(itemResponseSchema.parse(data).data)
    })
  },

  /**
   * PATCH does not accept belts, so the eligible belts are replaced after.
   * `teacherId` is only sent when it changed: teachers may not reassign a
   * class, only managers can.
   */
  update(
    id: string,
    values: ClassFormValues,
    previousTeacherId?: string,
  ): Promise<void> {
    return call(async () => {
      await http.patch(ENDPOINTS.item(id), {
        ...toClassBody(values),
        ...(values.teacherId && values.teacherId !== previousTeacherId
          ? { teacherId: values.teacherId }
          : {}),
      })
      await http.put(ENDPOINTS.belts(id), { beltIds: values.beltIds })
    })
  },

  remove(id: string): Promise<void> {
    return call(async () => {
      await http.delete(ENDPOINTS.item(id))
    })
  },

  listEnrollments(
    classId: string,
    signal?: AbortSignal,
  ): Promise<Enrollment[]> {
    return call(async () => {
      const { data } = await http.get<unknown>(ENDPOINTS.enrollments(classId), {
        params: { page: 1, limit: 100 },
        signal,
      })
      return enrollmentsResponseSchema.parse(data).data.data.map(toEnrollment)
    })
  },

  enroll(classId: string, practitionerId: string): Promise<void> {
    return call(async () => {
      await http.post(ENDPOINTS.enrollments(classId), { practitionerId })
    })
  },

  checkIn(classId: string, enrollmentId: string): Promise<void> {
    return call(async () => {
      await http.post(ENDPOINTS.checkIn(classId, enrollmentId))
    })
  },

  setParticipation(
    classId: string,
    enrollmentId: string,
    input: ParticipationInput,
  ): Promise<void> {
    return call(async () => {
      await http.patch(ENDPOINTS.participation(classId, enrollmentId), {
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        ...(input.reason ? { reason: input.reason } : {}),
      })
    })
  },

  cancelEnrollment(classId: string, enrollmentId: string): Promise<void> {
    return call(async () => {
      await http.post(ENDPOINTS.cancel(classId, enrollmentId))
    })
  },
}
