import { z } from 'zod'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import { envelopeSchema } from '@/shared/lib/api-schema'
import {
  caveAdminSchema,
  platformCaveSchema,
  platformCaveUnitSchema,
  type CaveAdmin,
  type CreateCaveAdminInput,
  type PlatformCave,
  type PlatformCaveUnit,
} from '@/features/platform/schemas/cave.schema'

const ENDPOINTS = {
  caves: '/platform/caves',
  units: (id: string) => `/platform/caves/${id}/units`,
  admins: (caveId: string) => `/platform/caves/${caveId}/admins`,
  admin: (caveId: string, adminId: string) =>
    `/platform/caves/${caveId}/admins/${adminId}`,
} as const

const caveListSchema = envelopeSchema(z.array(platformCaveSchema))
const unitsSchema = envelopeSchema(z.array(platformCaveUnitSchema))
const adminsSchema = envelopeSchema(z.array(caveAdminSchema))
const adminSchema = envelopeSchema(caveAdminSchema)

export const platformCaveService = {
  async list(signal?: AbortSignal): Promise<PlatformCave[]> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.caves, { signal })
      return caveListSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async listUnits(
    caveId: string,
    signal?: AbortSignal,
  ): Promise<PlatformCaveUnit[]> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.units(caveId), {
        signal,
      })
      return unitsSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async listAdmins(caveId: string, signal?: AbortSignal): Promise<CaveAdmin[]> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.admins(caveId), {
        signal,
      })
      return adminsSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async createAdmin(
    caveId: string,
    input: CreateCaveAdminInput,
  ): Promise<CaveAdmin> {
    try {
      const payload = input.userId
        ? { userId: input.userId }
        : { name: input.name, email: input.email, password: input.password }
      const { data } = await http.post<unknown>(
        ENDPOINTS.admins(caveId),
        payload,
      )
      return adminSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async removeAdmin(caveId: string, adminId: string): Promise<void> {
    try {
      await http.delete(ENDPOINTS.admin(caveId, adminId))
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
