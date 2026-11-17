import { z } from 'zod'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import { envelopeSchema } from '@/shared/lib/api-schema'
import {
  caveAdminSchema,
  createPlatformCaveSchema,
  platformCaveSchema,
  platformCaveUnitSchema,
  updatePlatformCaveSchema,
  type CaveAdmin,
  type CreateCaveAdminInput,
  type CreatePlatformCaveInput,
  type PlatformCave,
  type PlatformCaveUnit,
  type UpdatePlatformCaveInput,
} from '@/features/platform/schemas/cave.schema'

const ENDPOINTS = {
  caves: '/platform/caves',
  cave: (id: string) => `/platform/caves/${id}`,
  units: (id: string) => `/platform/caves/${id}/units`,
  admins: (caveId: string) => `/platform/caves/${caveId}/admins`,
  admin: (caveId: string, adminId: string) =>
    `/platform/caves/${caveId}/admins/${adminId}`,
} as const

const caveListSchema = envelopeSchema(z.array(platformCaveSchema))
const caveSchema = envelopeSchema(platformCaveSchema)
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

  async get(caveId: string, signal?: AbortSignal): Promise<PlatformCave> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.cave(caveId), {
        signal,
      })
      return caveSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async create(
    input: CreatePlatformCaveInput,
    signal?: AbortSignal,
  ): Promise<PlatformCave> {
    try {
      const payload = createPlatformCaveSchema.parse(input)
      const { data } = await http.post<unknown>(ENDPOINTS.caves, payload, {
        signal,
      })
      return caveSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async update(
    caveId: string,
    input: UpdatePlatformCaveInput,
    signal?: AbortSignal,
  ): Promise<PlatformCave> {
    try {
      const payload = updatePlatformCaveSchema.parse(input)
      const { data } = await http.patch<unknown>(
        ENDPOINTS.cave(caveId),
        payload,
        { signal },
      )
      return caveSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async archive(caveId: string, signal?: AbortSignal): Promise<void> {
    try {
      await http.delete(ENDPOINTS.cave(caveId), { signal })
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
