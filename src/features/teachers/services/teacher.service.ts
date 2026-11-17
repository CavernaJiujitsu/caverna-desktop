import { envelopeSchema, paginatedSchema } from '@/shared/lib/api-schema'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import {
  teacherSchema,
  type Teacher,
  type TeacherCreateInput,
  type TeacherUpdateInput,
} from '@/features/teachers/schemas/teacher.schema'

const ENDPOINTS = {
  list: '/teachers',
  item: (teacherId: string) => `/teachers/${teacherId}`,
  unitLink: '/memberships/teachers/cave-units',
  unitLinkItem: (teacherId: string, caveUnitId: string) =>
    `/memberships/teachers/cave-units/${teacherId}/${caveUnitId}`,
} as const

const teacherEnvelope = envelopeSchema(teacherSchema)
const teacherListSchema = envelopeSchema(paginatedSchema(teacherSchema))

export type TeacherListQuery = {
  page: number
  limit: number
  search?: string
  caveId?: string
}

export type TeacherPage = {
  items: Teacher[]
  page: number
  totalPage: number
  total: number
}

async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (error) {
    throw normalizeHttpError(error)
  }
}

export const teacherService = {
  list(query: TeacherListQuery, signal?: AbortSignal): Promise<TeacherPage> {
    return call(async () => {
      const { data } = await http.get<unknown>(ENDPOINTS.list, {
        params: {
          page: query.page,
          limit: query.limit,
          ...(query.search ? { search: query.search } : {}),
          ...(query.caveId ? { caveId: query.caveId } : {}),
        },
        signal,
      })
      const parsed = teacherListSchema.parse(data).data
      return {
        items: parsed.data,
        page: parsed._meta.page,
        totalPage: parsed._meta.totalPage,
        total: parsed._meta.total,
      }
    })
  },

  /** Also the way to read a teacher's linked units (`caveUnits`). */
  findOne(teacherId: string, signal?: AbortSignal): Promise<Teacher> {
    return call(async () => {
      const { data } = await http.get<unknown>(ENDPOINTS.item(teacherId), {
        signal,
      })
      return teacherEnvelope.parse(data).data
    })
  },

  create(input: TeacherCreateInput): Promise<Teacher> {
    return call(async () => {
      const { data } = await http.post<unknown>(ENDPOINTS.list, {
        name: input.name,
        email: input.email,
        password: input.password,
        ...(input.caveUnitIds?.length
          ? { caveUnitIds: input.caveUnitIds }
          : {}),
      })
      return teacherEnvelope.parse(data).data
    })
  },

  update(teacherId: string, input: TeacherUpdateInput): Promise<Teacher> {
    return call(async () => {
      const { data } = await http.patch<unknown>(
        ENDPOINTS.item(teacherId),
        input,
      )
      return teacherEnvelope.parse(data).data
    })
  },

  /** Removes only the teacher profile; the account may keep other access. */
  remove(teacherId: string): Promise<void> {
    return call(async () => {
      await http.delete(ENDPOINTS.item(teacherId))
    })
  },

  linkUnit(teacherId: string, caveUnitId: string): Promise<void> {
    return call(async () => {
      await http.post(ENDPOINTS.unitLink, { teacherId, caveUnitId })
    })
  },

  unlinkUnit(teacherId: string, caveUnitId: string): Promise<void> {
    return call(async () => {
      await http.delete(ENDPOINTS.unitLinkItem(teacherId, caveUnitId))
    })
  },
}
