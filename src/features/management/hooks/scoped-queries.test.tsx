import { useEffect, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClasses } from '@/features/classes/hooks/use-classes'
import { classService } from '@/features/classes/services/class.service'
import { useAcademies } from '@/features/academies/hooks/use-academies'
import { academyService } from '@/features/academies/services/academy.service'
import { queryClient } from '@/shared/lib/query-client'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession } from '@/shared/session/session'
import {
  setAccessToken,
  setManagementContextId,
} from '@/shared/session/access-token'
import type { ManagementContext } from '@/shared/types/management-context'

vi.mock('@/features/classes/services/class.service', () => ({
  classService: { list: vi.fn() },
}))
vi.mock('@/features/academies/services/academy.service', () => ({
  academyService: { list: vi.fn(), findOne: vi.fn() },
}))
const context: ManagementContext = {
  id: 'context-a',
  role: 'teacher',
  label: 'A',
  detail: 'A',
  caveId: 'cave-a',
  caveUnitId: 'unit-a',
  teacherId: 'teacher-a',
}
let currentContext = context
const defaults = queryClient.getDefaultOptions()
function Boot({ children }: { children: ReactNode }) {
  const { selectedContext, setSelectedContext, setSession } = useSession()
  useEffect(() => {
    setSession({
      accessToken: 'token',
      user: { id: 'user-a', name: null, email: 'qa@caverna.test' },
    })
    setSelectedContext(currentContext)
  }, [setSelectedContext, setSession])
  return selectedContext ? children : null
}
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Boot>{children}</Boot>
      </SessionProvider>
    </QueryClientProvider>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  queryClient.clear()
  queryClient.setDefaultOptions({ queries: { retry: false } })
  currentContext = context
  vi.mocked(classService.list).mockResolvedValue([])
})
afterEach(() => {
  queryClient.clear()
  queryClient.setDefaultOptions(defaults)
  setAccessToken(null)
  setManagementContextId(null)
})
describe('presentation scope of management queries', () => {
  it('keeps the teacher unit on the class request even when filters are cleared or forged', async () => {
    const { rerender } = renderHook(
      ({ unitId }) => useClasses({ unitId, date: '' }),
      { wrapper, initialProps: { unitId: 'other-unit' } },
    )
    await waitFor(() =>
      expect(classService.list).toHaveBeenCalledWith(
        { unitId: 'unit-a', date: '' },
        expect.any(AbortSignal),
      ),
    )
    await act(async () => rerender({ unitId: '' }))
    expect(
      vi
        .mocked(classService.list)
        .mock.calls.every(([filters]) => filters.unitId === 'unit-a'),
    ).toBe(true)
  })
  it('does not load the global academy list for an academy manager', async () => {
    currentContext = { ...context, role: 'academy' }
    vi.mocked(academyService.findOne).mockResolvedValue({
      id: 'cave-a',
      name: 'A',
      units: [],
    })
    const { result } = renderHook(() => useAcademies(), { wrapper })
    await waitFor(() =>
      expect(result.current.data).toEqual([
        { id: 'cave-a', name: 'A', units: [] },
      ]),
    )
    expect(academyService.findOne).toHaveBeenCalledWith(
      'cave-a',
      expect.any(AbortSignal),
    )
    expect(academyService.list).not.toHaveBeenCalled()
  })
})
