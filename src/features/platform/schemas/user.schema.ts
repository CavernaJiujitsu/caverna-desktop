import { z } from 'zod'
import { USER_ROLES, type UserRole } from '@/shared/types/user-role'

export const platformUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  photoKey: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type PlatformUser = z.infer<typeof platformUserSchema>

export const PLATFORM_USERS_MAX_PAGE_SIZE = 100

export type PlatformUsersFilter = {
  search?: string
  role?: UserRole
  caveId?: string
}

export type PlatformUsersQuery = PlatformUsersFilter & {
  page: number
  limit: number
}
