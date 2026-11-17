import { z } from 'zod'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import {
  academySchema,
  unitSchema,
  type Academy,
  type AcademyUnit,
} from '@/features/academies/schemas/academy.schema'
import {
  managedUnitSchema,
  type ManagedUnit,
  type UnitCreateInput,
  type UnitUpdateInput,
} from '@/features/academies/schemas/unit.schema'

const apiCave = z.object({
  id: z.string(),
  name: z.string(),
  units: z.array(unitSchema).optional(),
})
const listResponse = z.object({
  data: z.object({
    data: z.array(apiCave),
    _meta: z
      .object({ totalPage: z.number().int().nonnegative() })
      .passthrough()
      .optional(),
  }),
})
const unitsResponse = z.object({
  data: z.object({ data: z.array(unitSchema) }),
})
const managedUnitsResponse = z.object({
  data: z.object({
    data: z.array(managedUnitSchema),
    _meta: z.object({
      page: z.number().int().positive(),
      totalPage: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
    _links: z.record(z.string(), z.unknown()).optional(),
  }),
})
const managedUnitResponse = z.object({ data: managedUnitSchema })
export type UnitInput = UnitCreateInput
export type UnitPage = {
  items: ManagedUnit[]
  page: number
  totalPage: number
  total: number
}

export const academyService = {
  async list(signal?: AbortSignal): Promise<Academy[]> {
    try {
      const firstResponse = await http.get<unknown>('/caves', {
        params: { page: 1, limit: 100 },
        signal,
      })
      const firstPage = listResponse.parse(firstResponse.data).data
      const items = [...firstPage.data]
      for (let page = 2; page <= (firstPage._meta?.totalPage ?? 1); page += 1) {
        const response = await http.get<unknown>('/caves', {
          params: { page, limit: 100 },
          signal,
        })
        items.push(...listResponse.parse(response.data).data.data)
      }
      return items.map((item) =>
        academySchema.parse({ ...item, units: item.units ?? [] }),
      )
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
  async listUnits(
    caveId: string,
    signal?: AbortSignal,
  ): Promise<AcademyUnit[]> {
    try {
      const response = await http.get(`/caves/${caveId}/units`, {
        params: { page: 1, limit: 100 },
        signal,
      })
      return unitsResponse.parse(response.data).data.data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
  async listUnitsPage(
    caveId: string,
    params: { page: number; limit: number; search?: string },
    signal?: AbortSignal,
  ): Promise<UnitPage> {
    try {
      const response = await http.get<unknown>(`/caves/${caveId}/units`, {
        params,
        signal,
      })
      const parsed = managedUnitsResponse.parse(response.data).data
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
  async listAllManagedUnits(
    caveId: string,
    signal?: AbortSignal,
  ): Promise<ManagedUnit[]> {
    try {
      const firstPage = await this.listUnitsPage(
        caveId,
        { page: 1, limit: 100 },
        signal,
      )
      const items = [...firstPage.items]
      for (let page = 2; page <= firstPage.totalPage; page += 1) {
        const nextPage = await this.listUnitsPage(
          caveId,
          { page, limit: 100 },
          signal,
        )
        items.push(...nextPage.items)
      }
      return items
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
  async getUnit(
    caveId: string,
    unitId: string,
    signal?: AbortSignal,
  ): Promise<ManagedUnit> {
    try {
      const response = await http.get<unknown>(
        `/caves/${caveId}/units/${unitId}`,
        { signal },
      )
      return managedUnitResponse.parse(response.data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
  async createUnit(
    caveId: string,
    input: UnitInput,
    signal?: AbortSignal,
  ): Promise<ManagedUnit> {
    try {
      const response = await http.post<unknown>(
        `/caves/${caveId}/units`,
        input,
        { signal },
      )
      return managedUnitResponse.parse(response.data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
  async updateUnit(
    caveId: string,
    unitId: string,
    input: UnitUpdateInput,
    signal?: AbortSignal,
  ): Promise<ManagedUnit> {
    try {
      const response = await http.patch<unknown>(
        `/caves/${caveId}/units/${unitId}`,
        input,
        { signal },
      )
      return managedUnitResponse.parse(response.data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
  async removeUnit(
    caveId: string,
    unitId: string,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      await http.delete(`/caves/${caveId}/units/${unitId}`, { signal })
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
