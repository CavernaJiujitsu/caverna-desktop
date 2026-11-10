import { createContext, useContext } from 'react'
import type { ManagementContext } from '@/shared/types/management-context'

export type SessionUser = { id: string; email: string; name: string | null }
export type Session = {
  user: SessionUser
  accessToken: string
  practitionerId?: string
}

type SessionContextValue = {
  session: Session | null
  selectedContext: ManagementContext | null
  setSession: (session: Session | null) => void
  setSelectedContext: (context: ManagementContext | null) => void
  clearSession: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return ctx
}

export { SessionContext }
export type { SessionContextValue }
