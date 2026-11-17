import { envelopeSchema, paginatedSchema } from '@/shared/lib/api-schema'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import {
  practitionerListItemSchema,
  practitionerSchema,
  type Practitioner,
  type PractitionerInput,
  type PractitionerListPage,
} from '@/features/practitioners/schemas/practitioner.schema'

const ENDPOINTS = { list: '/practitioners' } as const

const listResponseSchema = envelopeSchema(paginatedSchema(practitionerSchema))
const itemResponseSchema = envelopeSchema(practitionerSchema)
const fullListResponseSchema = envelopeSchema(
  paginatedSchema(practitionerListItemSchema),
)

export const PRACTITIONERS_PAGE_SIZE = 20

export type PractitionerListQuery = {
  page: number
  search?: string
  caveId?: string
  caveUnitId?: string
}

export const practitionerService = {
  /** Full student listing (staff only); cave admins are scoped by the API. */
  async list(
    query: PractitionerListQuery,
    signal?: AbortSignal,
  ): Promise<PractitionerListPage> {
    try {
      // Empty filters are omitted: the API rejects empty UUID strings.
      const params = Object.fromEntries(
        Object.entries({ ...query, limit: PRACTITIONERS_PAGE_SIZE }).filter(
          ([, value]) => value !== undefined && value !== '',
        ),
      )
      const { data } = await http.get<unknown>(ENDPOINTS.list, {
        params,
        signal,
      })
      const page = fullListResponseSchema.parse(data).data
      return {
        items: page.data,
        page: page._meta.page,
        totalPages: page._meta.totalPage,
        total: page._meta.total,
      }
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  /** Searches students by name or e-mail (JWT required). */
  async search(search: string, signal?: AbortSignal): Promise<Practitioner[]> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.list, {
        params: { page: 1, limit: 10, ...(search ? { search } : {}) },
        signal,
      })
      return listResponseSchema.parse(data).data.data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async create(input: PractitionerInput): Promise<Practitioner> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.list, {
        user: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
        ...(input.latitude !== undefined && input.longitude !== undefined
          ? {
              coordinates: {
                latitude: input.latitude,
                longitude: input.longitude,
              },
            }
          : {}),
      })
      return itemResponseSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
