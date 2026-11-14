import { http, normalizeHttpError } from '@/shared/lib/axios'
import { envelopeSchema, paginatedSchema } from '@/shared/lib/api-schema'
import {
  PLATFORM_USERS_MAX_PAGE_SIZE,
  platformUserSchema,
  type PlatformUser,
  type PlatformUsersFilter,
  type PlatformUsersQuery,
} from '@/features/platform/schemas/user.schema'

const ENDPOINTS = {
  list: '/platform/users',
  item: (id: string) => `/platform/users/${id}`,
} as const

const userListSchema = envelopeSchema(paginatedSchema(platformUserSchema))
const userSchema = envelopeSchema(platformUserSchema)

export type PlatformUserPage = {
  items: PlatformUser[]
  page: number
  totalPage: number
  total: number
}

export const platformUserService = {
  async list(
    query: PlatformUsersQuery,
    signal?: AbortSignal,
  ): Promise<PlatformUserPage> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.list, {
        params: {
          page: query.page,
          limit: query.limit,
          ...(query.search ? { search: query.search } : {}),
          ...(query.role ? { role: query.role } : {}),
        },
        signal,
      })
      const parsed = userListSchema.parse(data).data
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

  async listAll(
    filters: PlatformUsersFilter,
    signal?: AbortSignal,
  ): Promise<PlatformUserPage> {
    const firstPage = await this.list(
      { ...filters, page: 1, limit: PLATFORM_USERS_MAX_PAGE_SIZE },
      signal,
    )
    const items = [...firstPage.items]
    for (let page = 2; page <= firstPage.totalPage; page += 1) {
      const nextPage = await this.list(
        { ...filters, page, limit: PLATFORM_USERS_MAX_PAGE_SIZE },
        signal,
      )
      items.push(...nextPage.items)
    }
    return {
      items,
      page: 1,
      totalPage: firstPage.totalPage,
      total: firstPage.total,
    }
  },

  async findOne(id: string, signal?: AbortSignal): Promise<PlatformUser> {
    try {
      const { data } = await http.get<unknown>(ENDPOINTS.item(id), { signal })
      return userSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await http.delete(ENDPOINTS.item(id))
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
