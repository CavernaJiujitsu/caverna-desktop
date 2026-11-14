import { describe, expect, it, vi, beforeEach } from 'vitest'
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

  it('creates a cave-scoped schedule without a unit id', async () => {
    mockedPost.mockResolvedValueOnce(envelope(schedule))
    const input = {
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
