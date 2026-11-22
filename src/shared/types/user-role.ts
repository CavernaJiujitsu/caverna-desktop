export const USER_ROLES = [
  'STUDENT',
  'TEACHER',
  'CAVE_ADMIN',
  'ADMIN',
  'ROOT',
] as const

export type UserRole = (typeof USER_ROLES)[number]

// ROOT always travels together with ADMIN, so it is a desktop role as well.
export const DESKTOP_ROLES: UserRole[] = [
  'TEACHER',
  'CAVE_ADMIN',
  'ADMIN',
  'ROOT',
]

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Aluno',
  TEACHER: 'Professor',
  CAVE_ADMIN: 'Gestor de caverna',
  ADMIN: 'Administrador',
  ROOT: 'Root',
}

export function isDesktopRole(role: UserRole): boolean {
  return DESKTOP_ROLES.includes(role)
}
