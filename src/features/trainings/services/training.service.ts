import type { z } from 'zod'
import {
  apiTrainingSchema,
  type TrainingItem,
  type TrainingPage,
} from '@/features/trainings/schemas/training.schema'
import { envelopeSchema, paginatedSchema } from '@/shared/lib/api-schema'
import { http, normalizeHttpError } from '@/shared/lib/axios'

export const TRAININGS_PAGE_SIZE = 20

const listResponseSchema = envelopeSchema(paginatedSchema(apiTrainingSchema))

export type TrainingQuery = {
  page: number
  caveId?: string
  caveUnitId?: string
  /** ISO datetime, inclusive. */
  from: string
  /** ISO datetime, inclusive. */
  to: string
}

function toTrainingItem(item: z.infer<typeof apiTrainingSchema>): TrainingItem {
  return {
    id: item.id,
    type: item.type,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    capacity: item.capacity,
    caveName: item.caveUnit?.cave?.name ?? null,
    caveUnitName: item.caveUnit?.name ?? 'Unidade não informada',
    teacherName: item.teacher?.user?.name ?? null,
    enrolledCount: item.enrolledCount,
    presentCount: item.presentCount,
  }
}

export const trainingService = {
  async list(
    query: TrainingQuery,
    signal?: AbortSignal,
  ): Promise<TrainingPage> {
    try {
      // Empty filters are omitted: the API rejects empty UUID strings.
      const params = Object.fromEntries(
        Object.entries({ ...query, limit: TRAININGS_PAGE_SIZE }).filter(
          ([, value]) => value !== undefined && value !== '',
        ),
      )
      const { data } = await http.get<unknown>('/classes', { params, signal })
      const page = listResponseSchema.parse(data).data
      return {
        items: page.data.map(toTrainingItem),
        page: page._meta.page,
        totalPages: page._meta.totalPage,
        total: page._meta.total,
      }
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
