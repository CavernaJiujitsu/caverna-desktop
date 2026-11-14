export const USER_ROLES = ['STUDENT', 'TEACHER', 'CAVE_ADMIN', 'ADMIN'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const DESKTOP_ROLES: UserRole[] = ['TEACHER', 'CAVE_ADMIN', 'ADMIN']

export function isDesktopRole(role: UserRole): boolean {
  return DESKTOP_ROLES.includes(role)
}
