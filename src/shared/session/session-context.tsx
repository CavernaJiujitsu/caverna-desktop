import { useCallback, useState, type ReactNode } from 'react'
import type { ManagementContext } from '@/shared/types/management-context'
import {
  SessionContext,
  type Session,
  type SessionContextValue,
} from './session'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null)
  const [contexts, setContextsState] = useState<ManagementContext[]>([])
  const [selectedContext, setSelectedContextState] =
    useState<ManagementContext | null>(null)

  const setSession = useCallback((s: Session | null) => setSessionState(s), [])
  const setContexts = useCallback(
    (c: ManagementContext[]) => setContextsState(c),
    [],
  )
  const setSelectedContext = useCallback(
    (c: ManagementContext | null) => setSelectedContextState(c),
    [],
  )
  const clearSession = useCallback(() => {
    setSessionState(null)
    setContextsState([])
    setSelectedContextState(null)
  }, [])

  const value: SessionContextValue = {
    session,
    contexts,
    selectedContext,
    setSession,
    setContexts,
    setSelectedContext,
    clearSession,
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
