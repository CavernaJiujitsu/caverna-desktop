import { useCallback, useState, type ReactNode } from 'react'
import type { ManagementContext } from '@/shared/types/management-context'
import {
  SessionContext,
  type Session,
  type SessionContextValue,
} from './session'
import { queryClient } from '@/shared/lib/query-client'
import {
  getManagementContextId,
  setAccessToken,
  setManagementContextId,
} from './access-token'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null)
  const [selectedContext, setSelectedContextState] =
    useState<ManagementContext | null>(null)

  const setSession = useCallback((s: Session | null) => {
    queryClient.clear()
    setManagementContextId(null)
    setSelectedContextState(null)
    setSessionState(s)
    setAccessToken(s?.accessToken ?? null)
  }, [])
  const setSelectedContext = useCallback((c: ManagementContext | null) => {
    if (getManagementContextId() !== (c?.id ?? null)) {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'management-contexts',
      })
    }
    setManagementContextId(c?.id ?? null)
    setSelectedContextState(c)
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
