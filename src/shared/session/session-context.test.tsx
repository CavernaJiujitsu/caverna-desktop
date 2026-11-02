import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession, type Session } from '@/shared/session/session'

const user: Session['user'] = {
  id: 'user-1',
  email: 'pessoa@exemplo.com',
  name: 'Pessoa',
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
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with no session, no contexts and no selected context', () => {
    const { result } = renderSession()
    expect(result.current.session).toBeNull()
    expect(result.current.contexts).toEqual([])
    expect(result.current.selectedContext).toBeNull()
  })

  it('sets and clears a session', () => {
    const { result } = renderSession()
    act(() => {
      result.current.setSession({ user, accessToken: 'token-abc' })
    })
    expect(result.current.session?.accessToken).toBe('token-abc')
    expect(result.current.session?.user.email).toBe('pessoa@exemplo.com')

    act(() => {
      result.current.clearSession()
    })
    expect(result.current.session).toBeNull()
    expect(result.current.selectedContext).toBeNull()
    expect(result.current.contexts).toEqual([])
  })

  it('sets contexts and a selected context', () => {
    const { result } = renderSession()
    const contexts = [
      { id: 'c1', role: 'academy' as const, label: 'Academia A', detail: 'x' },
    ]

    act(() => {
      result.current.setContexts(contexts)
      result.current.setSelectedContext(contexts[0] ?? null)
    })

    expect(result.current.contexts).toHaveLength(1)
    expect(result.current.selectedContext?.id).toBe('c1')
  })
})
