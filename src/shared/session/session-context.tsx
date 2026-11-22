import { useCallback, useRef, useState, type ReactNode } from 'react'
import type { ManagementContext } from '@/shared/types/management-context'
import {
  SessionContext,
  type Session,
  type SessionContextValue,
} from './session'
import { setAccessToken } from './access-token'
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from './session-storage'
import { queryClient } from '@/shared/lib/query-client'

const CONTEXT_QUERY_PREFIX = 'management-contexts'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [restored] = useState(() => {
    const stored = readStoredSession()
    setAccessToken(stored?.session.accessToken ?? null)
    return stored
  })
  const [session, setSessionState] = useState<Session | null>(
    restored?.session ?? null,
  )
  const [selectedContext, setSelectedContextState] =
    useState<ManagementContext | null>(restored?.selectedContext ?? null)
  const sessionRef = useRef<Session | null>(restored?.session ?? null)

  const setSession = useCallback((next: Session | null) => {
    sessionRef.current = next
    queryClient.clear()
    setSelectedContextState(null)
    setSessionState(next)
    setAccessToken(next?.accessToken ?? null)
    if (next) writeStoredSession({ session: next, selectedContext: null })
    else clearStoredSession()
  }, [])

  const setSelectedContext = useCallback((next: ManagementContext | null) => {
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== CONTEXT_QUERY_PREFIX,
    })
    setSelectedContextState(next)
    if (sessionRef.current) {
      writeStoredSession({
        session: sessionRef.current,
        selectedContext: next,
      })
    }
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
  }, [setSession])

  const value: SessionContextValue = {
    session,
    selectedContext,
    setSession,
    setSelectedContext,
    clearSession,
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
