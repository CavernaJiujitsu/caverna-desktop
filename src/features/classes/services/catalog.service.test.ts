import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import { listClassTeachers, listClassUnits } from './catalog.service'
import type { ManagementContext } from '@/shared/types/management-context'

vi.mock('@/shared/lib/axios', () => ({ http: { get: vi.fn() } }))
const get = vi.mocked(http.get)
const teacher: ManagementContext = {
  id: 'context',
  role: 'teacher',
  label: 'Caverna A · Centro',
  detail: 'Professor',
  caveId: '550e8400-e29b-41d4-a716-446655440001',
  caveUnitId: '550e8400-e29b-41d4-a716-446655440002',
  teacherId: '550e8400-e29b-41d4-a716-446655440003',
}
beforeEach(() => get.mockReset())
describe('catalog access by confirmed context', () => {
  it('reads a teacher unit through the protected backend contract', async () => {
    get.mockResolvedValue({
      data: {
        data: { caveUnitId: teacher.caveUnitId, caveUnitName: 'Centro' },
      },
    })
    const signal = new AbortController().signal
    expect(await listClassUnits(signal, teacher)).toEqual([
      { id: teacher.caveUnitId, name: 'Centro' },
    ])
    expect(get).toHaveBeenCalledWith(
      `/management/caves/${teacher.caveId}/units/${teacher.caveUnitId}`,
      { signal },
    )
  })
  it('does not query global identities to offer the teacher own profile', async () => {
    expect(await listClassTeachers(undefined, teacher)).toEqual([
      { id: teacher.teacherId, name: 'Seu perfil de professor' },
    ])
    expect(get).not.toHaveBeenCalled()
  })
  it('does not silently grant the global teacher collection to an academy context', async () => {
    expect(
      await listClassTeachers(undefined, { ...teacher, role: 'academy' }),
    ).toEqual([])
    expect(get).not.toHaveBeenCalled()
  })
  it('loads academy metadata only from the selected cave', async () => {
    get.mockResolvedValue({
      data: { data: { units: [{ id: 'unit-a', name: 'A' }] } },
    })
    expect(
      await listClassUnits(undefined, { ...teacher, role: 'academy' }),
    ).toEqual([{ id: 'unit-a', name: 'A' }])
    expect(get).toHaveBeenCalledWith(`/caves/${teacher.caveId}`, {
      signal: undefined,
    })
  })
})
