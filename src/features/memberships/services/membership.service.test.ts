import { beforeEach, describe, expect, it, vi } from 'vitest'
import { membershipService } from '@/features/memberships/services/membership.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const unitId = '550e8400-e29b-41d4-a716-446655440000'
const practitionerId = '660e8400-e29b-41d4-a716-446655440001'
const membership = {
  id: '770e8400-e29b-41d4-a716-446655440002',
  practitioner: {
    id: practitionerId,
    user: {
      id: '880e8400-e29b-41d4-a716-446655440003',
      name: 'Ana',
      email: 'ana@caverna.app',
    },
  },
}

describe('membershipService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists students linked to a unit', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: { data: [membership] },
    } as never)
    await expect(membershipService.listStudents(unitId)).resolves.toEqual([
      membership,
    ])
    expect(http.get).toHaveBeenCalledWith(
      `/memberships/students/cave-units/${unitId}/practitioners`,
      { signal: undefined },
    )
  })

  it('links and unlinks a student with only the contracted endpoints', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({
      data: { data: null },
    } as never)
    vi.mocked(http.delete).mockResolvedValueOnce({
      data: { data: null },
    } as never)
    await membershipService.linkStudent(practitionerId, unitId)
    await membershipService.unlinkStudent(practitionerId, unitId)
    expect(http.post).toHaveBeenCalledWith('/memberships/students/cave-units', {
      practitionerId,
      caveUnitId: unitId,
    })
    expect(http.delete).toHaveBeenCalledWith(
      `/memberships/students/cave-units/${practitionerId}/${unitId}`,
    )
  })
})
