import { z } from 'zod'
import { USER_ROLES, type UserRole } from '@/shared/types/user-role'

const roleSchema = z.enum(USER_ROLES)

export const platformUserSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: roleSchema,
    // Derived roles (same as login). Older API versions omit it.
    roles: z.array(roleSchema).optional(),
    // Cave administered by this user, when any.
    caveId: z.string().uuid().nullable().optional(),
    photoKey: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .transform((user) => ({
    ...user,
    roles: user.roles && user.roles.length > 0 ? user.roles : [user.role],
  }))

export type PlatformUser = z.output<typeof platformUserSchema>

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

// --- Access management (platform context) ---

export const MANAGEMENT_ROLES = ['ADMIN', 'CAVE_ADMIN', 'TEACHER'] as const
export type ManagementAccessRole = (typeof MANAGEMENT_ROLES)[number]

export const userAccessSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  primaryRole: roleSchema,
  roles: z.array(roleSchema),
  isRoot: z.boolean(),
  practitionerId: z.string().uuid().nullable(),
  caveAdmin: z
    .object({
      id: z.string().uuid(),
      caveId: z.string().uuid(),
      caveName: z.string(),
    })
    .nullable(),
  teacher: z
    .object({
      id: z.string().uuid(),
      caveUnits: z.array(
        z.object({
          id: z.string().uuid(),
          name: z.string(),
          // The access DTO types it `string | null` (unit without a loaded cave).
          caveId: z.string().uuid().nullable(),
        }),
      ),
    })
    .nullable(),
})

export type UserAccessView = z.infer<typeof userAccessSchema>

/** Body of POST /platform/users/:id/access. */
export type GrantAccessInput = {
  role: ManagementAccessRole
  caveId?: string
  caveUnitIds?: string[]
}

/** Body of POST /platform/users (management account with initial access). */
export type CreateManagementUserInput = GrantAccessInput & {
  name: string
  email: string
  password: string
}

/**
 * Shared form rules for granting access: CAVE_ADMIN needs a cave and TEACHER
 * needs at least one unit. The backend re-validates everything.
 */
const accessFields = {
  role: z.enum(MANAGEMENT_ROLES, { error: 'Selecione um perfil.' }),
  caveId: z.string(),
  caveUnitIds: z.array(z.string()),
}

function refineAccess(
  values: { role: ManagementAccessRole; caveId: string; caveUnitIds: string[] },
  context: z.RefinementCtx,
) {
  if (values.role === 'CAVE_ADMIN' && !values.caveId)
    context.addIssue({
      code: 'custom',
      message: 'Selecione a caverna.',
      path: ['caveId'],
    })
  if (values.role === 'TEACHER' && values.caveUnitIds.length === 0)
    context.addIssue({
      code: 'custom',
      message: 'Selecione ao menos uma unidade.',
      path: ['caveUnitIds'],
    })
}

export const grantAccessFormSchema = z
  .object(accessFields)
  .superRefine(refineAccess)

export const createManagementUserFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome.'),
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    ...accessFields,
  })
  .superRefine(refineAccess)

export type GrantAccessFormValues = z.infer<typeof grantAccessFormSchema>
export type CreateManagementUserFormValues = z.infer<
  typeof createManagementUserFormSchema
>

/** Converts form values into the API body, dropping fields the role ignores. */
export function toGrantAccessInput(
  values: GrantAccessFormValues,
): GrantAccessInput {
  if (values.role === 'CAVE_ADMIN')
    return { role: values.role, caveId: values.caveId }
  if (values.role === 'TEACHER')
    return { role: values.role, caveUnitIds: values.caveUnitIds }
  return { role: values.role }
}

// --- Privilege ladder (UX only; the backend enforces it) ---

export type AccessLadderTarget = {
  userId: string
  roles: UserRole[]
  isRoot?: boolean
}

/**
 * ROOT > ADMIN > CAVE_ADMIN > TEACHER > STUDENT. Nobody changes ROOT or
 * themselves, and only ROOT changes an ADMIN. Returns the reason when the
 * actor cannot manage the target, or null when actions are allowed.
 */
export function accessLockReason(
  actor: { userId: string; roles: UserRole[] },
  target: AccessLadderTarget,
): string | null {
  if (target.isRoot || target.roles.includes('ROOT'))
    return 'O usuário root não pode ter acessos alterados nem ser removido.'
  if (target.userId === actor.userId)
    return 'Você não pode alterar os próprios acessos nem remover a própria conta.'
  if (target.roles.includes('ADMIN') && !actor.roles.includes('ROOT'))
    return 'Somente o usuário root pode alterar administradores da plataforma.'
  return null
}

/** Only ROOT may hand out the platform ADMIN access. */
export function grantableRoles(actorIsRoot: boolean): ManagementAccessRole[] {
  return actorIsRoot
    ? ['TEACHER', 'CAVE_ADMIN', 'ADMIN']
    : ['TEACHER', 'CAVE_ADMIN']
}
