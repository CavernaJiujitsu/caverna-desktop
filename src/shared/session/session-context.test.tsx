import { afterEach, describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SessionProvider } from './session-context'
import { useSession, type Session } from './session'
import {
  getAccessToken,
  getManagementContextId,
  setAccessToken,
  setManagementContextId,
} from './access-token'
import { queryClient } from '@/shared/lib/query-client'
const session: Session = {
  user: { id: 'user-1', email: 'qa@caverna.test', name: null },
  accessToken: 'token',
}
function mount() {
  return renderHook(() => useSession(), { wrapper: SessionProvider })
}
afterEach(() => {
  queryClient.clear()
  setAccessToken(null)
  setManagementContextId(null)
})
describe('session ownership and query isolation', () => {
  it('starts without identity or selected context', () => {
    const { result } = mount()
    expect(result.current.session).toBeNull()
    expect(result.current.selectedContext).toBeNull()
  })
  it('accepts management without practitioner and clears identity, selector and cache on logout', () => {
    const { result } = mount()
    act(() => {
      result.current.setSession(session)
      result.current.setSelectedContext({
        id: 'a',
        role: 'academy',
        label: 'A',
        detail: 'A',
      })
    })
    queryClient.setQueryData(['private-data'], 'private')
    expect(result.current.session?.practitionerId).toBeUndefined()
    expect(getAccessToken()).toBe('token')
    expect(getManagementContextId()).toBe('a')
    act(() => result.current.clearSession())
    expect(result.current.session).toBeNull()
    expect(result.current.selectedContext).toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(getManagementContextId()).toBeNull()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
  it('removes previous scope data but keeps the authoritative context list during selection', () => {
    const { result } = mount()
    act(() => result.current.setSession(session))
    queryClient.setQueryData(['private-data'], 'private')
    queryClient.setQueryData(
      ['management-contexts', session.user.id],
      ['server-context'],
    )
    act(() =>
      result.current.setSelectedContext({
        id: 'a',
        role: 'academy',
        label: 'A',
        detail: 'A',
      }),
    )
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined()
    expect(
      queryClient.getQueryData(['management-contexts', session.user.id]),
    ).toEqual(['server-context'])
    queryClient.setQueryData(['classes'], ['scope-a'])
    act(() => result.current.setSelectedContext(null))
    expect(queryClient.getQueryData(['classes'])).toBeUndefined()
    expect(getManagementContextId()).toBeNull()
  })
  it('cannot carry selection or cached data into a different account', () => {
    const { result } = mount()
    act(() => {
      result.current.setSession(session)
      result.current.setSelectedContext({
        id: 'a',
        role: 'academy',
        label: 'A',
        detail: 'A',
      })
    })
    queryClient.setQueryData(['management-contexts', 'user-1'], ['old'])
    act(() =>
      result.current.setSession({
        ...session,
        user: { ...session.user, id: 'user-2' },
        accessToken: 'new-token',
      }),
    )
    expect(result.current.selectedContext).toBeNull()
    expect(getManagementContextId()).toBeNull()
    expect(getAccessToken()).toBe('new-token')
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})
