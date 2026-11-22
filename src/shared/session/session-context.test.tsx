import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession, type Session } from '@/shared/session/session'
import { getAccessToken } from '@/shared/session/access-token'
import {
  readStoredSession,
  writeStoredSession,
} from '@/shared/session/session-storage'

const user: Session['user'] = {
  id: 'user-1',
  email: 'pessoa@exemplo.com',
  name: 'Pessoa',
}

const context = {
  id: 'academy:cave-1',
  role: 'academy' as const,
  label: 'Academia A',
  detail: 'Todas as unidades',
}

function validSession(overrides: Partial<Session> = {}): Session {
  return {
    user,
    accessToken: 'token-abc',
    expiresAt: Date.now() + 7_200_000,
    roles: ['CAVE_ADMIN', 'TEACHER'],
    teacherId: 'teacher-1',
    caveId: 'cave-1',
    ...overrides,
  }
}

function renderSession() {
  return renderHook(() => useSession(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    ),
  })
}

describe('session context', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with no session and no selected context', () => {
    const { result } = renderSession()
    expect(result.current.session).toBeNull()
    expect(result.current.selectedContext).toBeNull()
  })

  it('sets session roles and profile ids, then clears everything', () => {
    const { result } = renderSession()
    act(() => {
      result.current.setSession({
        user,
        accessToken: 'token-abc',
        expiresAt: Date.now() + 7_200_000,
        roles: ['CAVE_ADMIN', 'TEACHER'],
        teacherId: 'teacher-1',
        caveId: 'cave-1',
      })
    })
    expect(result.current.session?.accessToken).toBe('token-abc')
    expect(result.current.session?.roles).toEqual(['CAVE_ADMIN', 'TEACHER'])
    expect(result.current.session?.teacherId).toBe('teacher-1')
    expect(result.current.session?.caveId).toBe('cave-1')
    expect(result.current.session?.practitionerId).toBeUndefined()
    expect(getAccessToken()).toBe('token-abc')
    expect(readStoredSession()?.session.accessToken).toBe('token-abc')

    act(() => {
      result.current.clearSession()
    })
    expect(result.current.session).toBeNull()
    expect(result.current.selectedContext).toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(readStoredSession()).toBeNull()
  })

  it('keeps the selected context local and clears it on session change', () => {
    const { result } = renderSession()

    act(() => {
      result.current.setSession(validSession())
      result.current.setSelectedContext(context)
    })

    expect(result.current.selectedContext).toEqual(context)
    expect(result.current.session?.accessToken).toBe('token-abc')
    expect(readStoredSession()?.selectedContext).toEqual(context)
    expect(readStoredSession()?.session.accessToken).toBe('token-abc')

    act(() => {
      result.current.setSession(
        validSession({ accessToken: 'token-def', roles: ['ADMIN'] }),
      )
    })
    expect(result.current.selectedContext).toBeNull()
    expect(result.current.session?.accessToken).toBe('token-def')
    expect(readStoredSession()?.selectedContext).toBeNull()
    expect(readStoredSession()?.session.accessToken).toBe('token-def')
  })

  it('restores a valid persisted session and context on mount', () => {
    writeStoredSession({ session: validSession(), selectedContext: context })

    const { result } = renderSession()

    expect(result.current.session?.accessToken).toBe('token-abc')
    expect(result.current.session?.roles).toEqual(['CAVE_ADMIN', 'TEACHER'])
    expect(result.current.session?.teacherId).toBe('teacher-1')
    expect(result.current.selectedContext).toEqual(context)
    expect(getAccessToken()).toBe('token-abc')
  })

  it('ignores an expired persisted session', () => {
    writeStoredSession({
      session: validSession({ expiresAt: Date.now() - 1 }),
      selectedContext: context,
    })

    const { result } = renderSession()

    expect(result.current.session).toBeNull()
    expect(result.current.selectedContext).toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(readStoredSession()).toBeNull()
  })
})
