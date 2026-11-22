import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiClassBeforeC1,
  apiClassC1,
  apiClassPage,
} from '@/features/classes/testing/class-api.fixtures'
import { resolvePeriod } from '@/features/trainings/schemas/training.schema'
import { trainingService } from '@/features/trainings/services/training.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedGet = vi.mocked(http.get)

describe('trainingService.list', () => {
  beforeEach(() => mockedGet.mockReset())

  it('maps seat usage, the C1 teacher name and omits empty filters', async () => {
    mockedGet.mockResolvedValueOnce({
      data: apiClassPage(
        [{ ...apiClassC1, enrolledCount: 12, presentCount: 8 }],
        {
          page: 1,
          totalPage: 3,
          total: 41,
        },
      ),
    })

    const result = await trainingService.list({
      page: 1,
      caveId: '',
      caveUnitId: undefined,
      from: '2026-11-17T03:00:00.000Z',
      to: '2026-11-25T02:59:59.999Z',
    })

    expect(mockedGet).toHaveBeenCalledWith('/classes', {
      params: {
        page: 1,
        limit: 20,
        from: '2026-11-17T03:00:00.000Z',
        to: '2026-11-25T02:59:59.999Z',
      },
      signal: undefined,
    })
    expect(result).toEqual({
      items: [
        {
          id: '6894218a-cbdb-477c-82c7-b4ed6b934430',
          type: 'EXAM',
          startsAt: '2026-11-14T18:00:00.000Z',
          endsAt: '2026-11-14T19:30:00.000Z',
          capacity: 20,
          caveName: 'Caverna Matriz',
          caveUnitName: 'Consolação',
          teacherName: 'Juliana Gracie',
          enrolledCount: 12,
          presentCount: 8,
        },
      ],
      page: 1,
      totalPages: 3,
      total: 41,
    })
  })

  it('accepts the payload without teacher.user and leaves the name empty', async () => {
    mockedGet.mockResolvedValueOnce({
      data: apiClassPage([apiClassBeforeC1], {
        page: 1,
        totalPage: 1,
        total: 1,
      }),
    })

    const result = await trainingService.list({
      page: 1,
      caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
      from: '2026-11-01T03:00:00.000Z',
      to: '2026-11-08T02:59:59.999Z',
    })

    expect(result.items[0]).toMatchObject({
      teacherName: null,
      enrolledCount: 0,
      presentCount: 0,
    })
    expect(mockedGet.mock.calls[0]?.[1]?.params).toMatchObject({
      caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
    })
  })
})

describe('resolvePeriod', () => {
  it('keeps a range of up to 31 days as chosen', () => {
    expect(resolvePeriod('2026-11-01', '2026-12-02')).toEqual({
      valid: true,
      fromDate: '2026-11-01',
      toDate: '2026-12-02',
      limited: false,
    })
  })

  it('blocks a start after the end with the FRD message', () => {
    expect(resolvePeriod('2026-11-20', '2026-11-19')).toEqual({
      valid: false,
      error: 'A data inicial deve ser anterior à final.',
    })
  })

  it('limits a longer range to 31 days instead of blocking it', () => {
    expect(resolvePeriod('2026-11-01', '2026-12-10')).toEqual({
      valid: true,
      fromDate: '2026-11-01',
      toDate: '2026-12-02',
      limited: true,
    })
  })

  it('limits across a month and year boundary', () => {
    expect(resolvePeriod('2026-12-15', '2027-03-01')).toMatchObject({
      toDate: '2027-01-15',
      limited: true,
    })
  })

  it('asks for both dates when one is missing', () => {
    expect(resolvePeriod('', '2026-11-19')).toEqual({
      valid: false,
      error: 'Informe a data inicial e a final.',
    })
  })
})
