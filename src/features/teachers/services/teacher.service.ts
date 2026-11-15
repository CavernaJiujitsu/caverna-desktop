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
  membership: '/memberships/teachers/cave-units',
  membershipItem: (teacherId: string, caveUnitId: string) =>
    `/memberships/teachers/cave-units/${teacherId}/${caveUnitId}`,
} as const

const teacherSchemaEnvelope = envelopeSchema(teacherSchema)
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

export const teacherService = {
  async list(
    query: TeacherListQuery,
    signal?: AbortSignal,
  ): Promise<TeacherPage> {
    try {
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
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async findOne(teacherId: string, signal?: AbortSignal): Promise<Teacher> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.item(teacherId), {
        signal,
      })
      return teacherSchemaEnvelope.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async create(input: TeacherCreateInput): Promise<Teacher> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.list, input)
      return teacherSchemaEnvelope.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async linkExisting(input: { userId: string }): Promise<Teacher> {
    try {
      const { data } = await http.post<unknown>(
        '/teachers/existing',
        input,
      )
      return teacherSchemaEnvelope.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async update(teacherId: string, input: TeacherUpdateInput): Promise<Teacher> {
    try {
      const { data } = await http.patch<unknown>(
        ENDPOINTS.item(teacherId),
        input,
      )
      return teacherSchemaEnvelope.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async remove(teacherId: string): Promise<void> {
    try {
      await http.delete(ENDPOINTS.item(teacherId))
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async linkUnit(teacherId: string, caveUnitId: string): Promise<void> {
    try {
      await http.post(ENDPOINTS.membership, { teacherId, caveUnitId })
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async unlinkUnit(teacherId: string, caveUnitId: string): Promise<void> {
    try {
      await http.delete(ENDPOINTS.membershipItem(teacherId, caveUnitId))
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
