import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import { teacherService } from '@/features/teachers/services/teacher.service'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const teacherId = '11111111-1111-4111-8111-111111111111'
const caveId = '22222222-2222-4222-8222-222222222222'
const unitId = '33333333-3333-4333-8333-333333333333'
const teacher = {
  id: teacherId,
  name: 'Rafael Souza',
  email: 'rafael@caverna.app',
}

describe('teacherService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the paginated teacher list with the cave scope', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        data: {
          data: [teacher],
          _meta: { page: 1, totalPage: 1, total: 1 },
          _links: {},
        },
      },
    } as never)

    await expect(
      teacherService.list({ page: 1, limit: 20, search: 'rafa', caveId }),
    ).resolves.toMatchObject({ items: [teacher], total: 1 })
    expect(http.get).toHaveBeenCalledWith('/teachers', {
      params: { page: 1, limit: 20, search: 'rafa', caveId },
      signal: undefined,
    })
  })

  it('creates a teacher with the contracted payload', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({
      data: { data: teacher },
    } as never)
    await teacherService.create({
      name: teacher.name,
      email: teacher.email,
      password: 'initial-password',
      caveUnitIds: [{ caveUnitId: unitId, caveName: 'Caverna Matriz' }],
    })
    expect(http.post).toHaveBeenCalledWith('/teachers', {
      name: teacher.name,
      email: teacher.email,
      password: 'initial-password',
      caveUnitIds: [{ caveUnitId: unitId, caveName: 'Caverna Matriz' }],
    })
  })

  it('creates a teacher without unit associations when the cave scope is used', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({
      data: { data: teacher },
    } as never)

    await teacherService.create({
      name: teacher.name,
      email: teacher.email,
      password: 'initial-password',
    })

    expect(http.post).toHaveBeenCalledWith('/teachers', {
      name: teacher.name,
      email: teacher.email,
      password: 'initial-password',
    })
  })

  it('links and unlinks a teacher from a unit', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({
      data: { data: null },
    } as never)
    vi.mocked(http.delete).mockResolvedValueOnce({
      data: { data: null },
    } as never)
    await teacherService.linkUnit(teacherId, unitId)
    await teacherService.unlinkUnit(teacherId, unitId)
    expect(http.post).toHaveBeenCalledWith('/memberships/teachers/cave-units', {
      teacherId,
      caveUnitId: unitId,
    })
    expect(http.delete).toHaveBeenCalledWith(
      `/memberships/teachers/cave-units/${teacherId}/${unitId}`,
    )
  })
})
