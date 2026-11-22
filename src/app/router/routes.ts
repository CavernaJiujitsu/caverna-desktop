import type { ManagementRole } from '@/shared/types/management-context'

export const routes = {
  home: '/',
  login: '/login',
  passwordRecovery: '/password-recovery',
  passwordRecoveryReset: '/password-recovery/reset',
  units: '/units',
  classes: '/classes',
  schedules: '/schedules',
  evaluations: '/evaluations',
  memberships: '/memberships',
  practitionersCreate: '/practitioners/create',
  teachers: '/teachers',
  platformCaves: '/platform/caves',
  platformCavesCreate: '/platform/caves/create',
  caveAdministrators: '/administradores',
  platformUsers: '/platform/users',
  graduationCatalog: '/platform/graduation-catalog',
  trainings: '/trainings',
  management: '/management',
  accessDenied: '/access-denied',
  sessionExpired: '/session-expired',
} as const

const trainingContexts: readonly ManagementRole[] = ['academy', 'teacher']
const platformContexts: readonly ManagementRole[] = ['platform']
const academyManagementContexts: readonly ManagementRole[] = [
  'platform',
  'academy',
]

/**
 * Management contexts allowed to open each guarded route. The router guard and
 * every link to a guarded route read this single map, so a link is never shown
 * to a context the guard would send to access-denied. UX only: the backend
 * authorizes every request.
 */
export const routeContextRoles = {
  units: academyManagementContexts,
  classes: trainingContexts,
  schedules: trainingContexts,
  evaluations: trainingContexts,
  memberships: academyManagementContexts,
  practitionersCreate: academyManagementContexts,
  teachers: academyManagementContexts,
  platformCaves: platformContexts,
  platformCavesCreate: platformContexts,
  caveAdministrators: academyManagementContexts,
  platformUsers: platformContexts,
  graduationCatalog: platformContexts,
  trainings: academyManagementContexts,
} as const satisfies Partial<
  Record<keyof typeof routes, readonly ManagementRole[]>
>

export type GuardedRoute = keyof typeof routeContextRoles

/** Whether the given management context may open a guarded route. */
export function canOpenRoute(
  route: GuardedRoute,
  role: ManagementRole | null | undefined,
): boolean {
  return role != null && routeContextRoles[route].includes(role)
}
