import { describe, expect, it, vi, beforeEach } from 'vitest'
import { scheduleTeacherName } from '@/features/schedules/schemas/schedule.schema'
import { scheduleService } from '@/features/schedules/services/schedule.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedGet = vi.mocked(http.get)
const mockedPost = vi.mocked(http.post)
const mockedPatch = vi.mocked(http.patch)
const mockedDelete = vi.mocked(http.delete)

const scheduleId = '550e8400-e29b-41d4-a716-446655440000'
const unitId = '660e8400-e29b-41d4-a716-446655440001'
const teacherId = '770e8400-e29b-41d4-a716-446655440002'

const schedule = {
  id: scheduleId,
  caveUnitId: unitId,
  teacherId,
  title: 'Treino de Segunda',
  startsAt: '1970-01-01T19:00:00.000Z',
  endsAt: '1970-01-01T20:30:00.000Z',
  dayOfWeek: 1,
  startDate: '2026-10-05',
  endDate: '2027-02-15',
  capacity: 30,
  active: true,
  caveUnit: { id: unitId, name: 'Unidade Centro' },
  teacher: { id: teacherId },
}

// The local seed has no schedule (GET /training/schedules → `data: []` on
// 17/11), so this item follows the entity columns and the backend C1
// projection (`toClassScheduleView`); caveUnit and teacher come from the real
// GET /classes payload.
const apiScheduleC1 = {
  id: '5b1f0a3e-6f6c-4d55-9a57-2f4e8d1c0b11',
  createdAt: '2026-11-17T03:47:49.379Z',
  updatedAt: '2026-11-17T03:47:49.379Z',
  createdBy: null,
  caveUnitId: '7ad902c2-4988-47fc-8340-e7bc2dc3b477',
  teacherId: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
  title: 'Treino de Segunda',
  startsAt: '2026-11-16T22:00:00.000Z',
  endsAt: '2026-11-16T23:30:00.000Z',
  dayOfWeek: 1,
  startDate: '2026-11-16',
  endDate: '2027-05-16',
  capacity: 30,
  active: true,
  caveUnit: {
    id: '7ad902c2-4988-47fc-8340-e7bc2dc3b477',
    createdAt: '2026-11-17T03:47:49.379Z',
    updatedAt: '2026-11-17T03:47:49.379Z',
    createdBy: null,
    name: 'Consolação',
    address: 'Rua da Consolação, 2200',
    neighborhood: 'Consolação',
    latitude: '-23.55497000',
    longitude: '-46.66103000',
    active: true,
  },
  teacher: {
    id: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
    user: {
      id: '873ad65a-2a1c-4506-b98d-909e82a94a68',
      name: 'Juliana Gracie',
    },
  },
}

/** Same item before C1: the teacher carries only its audit fields. */
const apiScheduleBeforeC1 = {
  ...apiScheduleC1,
  teacher: {
    id: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
    createdAt: '2026-11-17T03:47:49.379Z',
    updatedAt: '2026-11-17T03:47:49.379Z',
    createdBy: null,
  },
}

function envelope<T>(data: T) {
  return { data: { message: 'OK', data } }
}

describe('scheduleService', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
    mockedPatch.mockReset()
    mockedDelete.mockReset()
  })

  it('lists schedules from the envelope', async () => {
    mockedGet.mockResolvedValueOnce(envelope([schedule]))

    await expect(scheduleService.list()).resolves.toEqual([schedule])
    expect(mockedGet).toHaveBeenCalledWith('/training/schedules', {
      signal: undefined,
    })
  })

  it('reads the teacher name from teacher.user (contract C1)', async () => {
    mockedGet.mockResolvedValueOnce(envelope([apiScheduleC1]))

    const [item] = await scheduleService.list()

    expect(item).toMatchObject({
      id: apiScheduleC1.id,
      caveUnit: { name: 'Consolação' },
    })
    expect(item && scheduleTeacherName(item)).toBe('Juliana Gracie')
  })

  it('falls back when the API omits teacher.user', async () => {
    mockedGet.mockResolvedValueOnce(envelope(apiScheduleBeforeC1))

    const item = await scheduleService.findOne(apiScheduleBeforeC1.id)

    expect(mockedGet).toHaveBeenCalledWith(
      `/training/schedules/${apiScheduleBeforeC1.id}`,
      { signal: undefined },
    )
    expect(scheduleTeacherName(item)).toBe('Professor não informado')
  })

  it('drops the full teacher user that PATCH and DELETE still return', async () => {
    // Backend code (read only): update/deactivate load `teacher.user`
    // (WITH_SCHEDULE_CONTEXT) and answer with the entity, outside the C1
    // projection. The User fields follow the real serialization; the e-mail
    // value is illustrative.
    const withFullTeacher = {
      ...apiScheduleC1,
      teacher: {
        id: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
        createdAt: '2026-11-17T03:47:49.379Z',
        updatedAt: '2026-11-17T03:47:49.379Z',
        createdBy: null,
        user: {
          id: '873ad65a-2a1c-4506-b98d-909e82a94a68',
          createdAt: '2026-11-17T03:47:49.379Z',
          updatedAt: '2026-11-17T03:47:49.379Z',
          createdBy: null,
          name: 'Juliana Gracie',
          email: 'juliana.gracie@caverna.com',
          role: 'TEACHER',
          photoKey: null,
        },
      },
    }
    mockedPatch.mockResolvedValueOnce(
      envelope({ scope: 'single', updated: 1, schedules: [withFullTeacher] }),
    )
    mockedDelete.mockResolvedValueOnce(
      envelope({ ...withFullTeacher, active: false }),
    )

    const updated = await scheduleService.update(scheduleId, {
      title: 'Treino de Segunda',
      dayOfWeek: 1,
      startsAt: '19:00',
      endsAt: '20:30',
      startDate: '2026-11-16',
      endDate: '2027-05-16',
      capacity: 30,
      active: true,
      scope: 'single',
    })
    const deactivated = await scheduleService.deactivate(scheduleId)

    expect(updated.schedules[0]?.teacher).toEqual({
      id: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
      user: { name: 'Juliana Gracie' },
    })
    expect(JSON.stringify([updated, deactivated])).not.toContain(
      'juliana.gracie@caverna.com',
    )
  })

  it('creates a schedule with the contract fields', async () => {
    mockedPost.mockResolvedValueOnce(envelope(schedule))
    const input = {
      caveUnitId: unitId,
      teacherId,
      title: 'Treino de Segunda',
      dayOfWeek: 1,
      startsAt: '19:00',
      endsAt: '20:30',
      startDate: '2026-10-05',
      endDate: '2027-02-15',
      capacity: 30,
      active: true,
    }

    await expect(scheduleService.create(input)).resolves.toEqual(schedule)
    expect(mockedPost).toHaveBeenCalledWith('/training/schedules', input)
  })

  it('creates a schedule for its selected unit', async () => {
    mockedPost.mockResolvedValueOnce(envelope(schedule))
    const input = {
      caveUnitId: unitId,
      teacherId,
      title: 'Treino de Segunda',
      dayOfWeek: 1,
      startsAt: '19:00',
      endsAt: '20:30',
      startDate: '2026-10-05',
      endDate: '2027-02-15',
      capacity: 30,
      active: true,
    }

    await expect(scheduleService.create(input)).resolves.toEqual(schedule)
    expect(mockedPost).toHaveBeenCalledWith('/training/schedules', input)
  })

  it('updates a schedule with the selected scope', async () => {
    const result = { scope: 'all' as const, updated: 2, schedules: [schedule] }
    mockedPatch.mockResolvedValueOnce(envelope(result))

    await expect(
      scheduleService.update(scheduleId, {
        title: 'Treino atualizado',
        dayOfWeek: 1,
        startsAt: '19:00',
        endsAt: '20:30',
        startDate: '2026-10-05',
        endDate: '2027-02-15',
        capacity: 30,
        active: true,
        scope: 'all',
      }),
    ).resolves.toEqual(result)
    expect(mockedPatch).toHaveBeenCalledWith(
      `/training/schedules/${scheduleId}`,
      expect.objectContaining({ scope: 'all' }),
    )
  })

  it('deactivates through DELETE', async () => {
    mockedDelete.mockResolvedValueOnce(envelope({ ...schedule, active: false }))

    await expect(scheduleService.deactivate(scheduleId)).resolves.toMatchObject(
      { id: scheduleId, active: false },
    )
    expect(mockedDelete).toHaveBeenCalledWith(
      `/training/schedules/${scheduleId}`,
    )
  })
})
