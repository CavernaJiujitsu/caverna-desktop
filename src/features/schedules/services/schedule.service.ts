import { z } from 'zod'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import { envelopeSchema } from '@/shared/lib/api-schema'
import {
  scheduleSchema,
  scheduleUpdateResultSchema,
  type ClassSchedule,
  type CreateScheduleInput,
  type ScheduleUpdateResult,
  type UpdateScheduleInput,
} from '@/features/schedules/schemas/schedule.schema'

const ENDPOINTS = {
  list: '/training/schedules',
  item: (id: string) => `/training/schedules/${id}`,
} as const

const scheduleResponseSchema = envelopeSchema(scheduleSchema)
const scheduleListResponseSchema = envelopeSchema(z.array(scheduleSchema))
const scheduleUpdateResponseSchema = envelopeSchema(scheduleUpdateResultSchema)

export const scheduleService = {
  async list(signal?: AbortSignal): Promise<ClassSchedule[]> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.list, { signal })
      return scheduleListResponseSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async findOne(id: string, signal?: AbortSignal): Promise<ClassSchedule> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.item(id), { signal })
      return scheduleResponseSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async create(input: CreateScheduleInput): Promise<ClassSchedule> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.list, input)
      return scheduleResponseSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async update(
    id: string,
    input: UpdateScheduleInput,
  ): Promise<ScheduleUpdateResult> {
    try {
      const { data } = await http.patch<unknown>(ENDPOINTS.item(id), input)
      return scheduleUpdateResponseSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async deactivate(id: string): Promise<ClassSchedule> {
    try {
      const { data } = await http.delete<unknown>(ENDPOINTS.item(id))
      return scheduleResponseSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
