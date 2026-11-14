import { z } from 'zod'
import type { ManagementContext } from '@/shared/types/management-context'
import { USER_ROLES } from '@/shared/types/user-role'
import type { Session } from './session'

export const SESSION_STORAGE_KEY = 'caverna.desktop.session'

const SESSION_STORAGE_VERSION = 1

const sessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().nullable(),
  }),
  accessToken: z.string().min(1),
  roles: z.array(z.enum(USER_ROLES)).min(1),
  practitionerId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  caveId: z.string().min(1).optional(),
  expiresAt: z.number().int().positive(),
})

const managementContextSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['platform', 'academy', 'teacher']),
  label: z.string().min(1),
  detail: z.string(),
})

const storedSessionSchema = z.object({
  version: z.literal(SESSION_STORAGE_VERSION),
  session: sessionSchema,
  selectedContext: managementContextSchema.nullable(),
})

export type PersistedSession = {
  session: Session
  selectedContext: ManagementContext | null
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function clearStoredSession() {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Storage can be unavailable (disabled or quota); the session still lives
    // in memory for the current tab.
  }
}

export function readStoredSession(): PersistedSession | null {
  const storage = getStorage()
  if (!storage) return null

  let raw: string | null
  try {
    raw = storage.getItem(SESSION_STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed = storedSessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || parsed.data.session.expiresAt <= Date.now()) {
      clearStoredSession()
      return null
    }
    return {
      session: parsed.data.session,
      selectedContext: parsed.data.selectedContext,
    }
  } catch {
    clearStoredSession()
    return null
  }
}

export function writeStoredSession(value: PersistedSession) {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ version: SESSION_STORAGE_VERSION, ...value }),
    )
  } catch {
    // Persistence is best-effort; a storage failure must not block login.
  }
}
