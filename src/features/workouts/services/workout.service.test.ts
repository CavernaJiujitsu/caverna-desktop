import { describe, expect, it, vi, beforeEach } from 'vitest'
import { workoutService } from '@/features/workouts/services/workout.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedGet = vi.mocked(http.get)

const actorId = '550e8400-e29b-41d4-a716-446655440000'
const workoutId = '660e8400-e29b-41d4-a716-446655440001'

describe('workoutService', () => {
  beforeEach(() => {
    mockedGet.mockReset()
  })

  it('parses the desktop workouts envelope', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        message: 'Lista de treinos',
        data: {
          actorId,
          items: [
            {
              id: workoutId,
              name: 'Caverna Centro',
              type: 'cave',
              startsAt: '2026-11-07T12:00:00.000Z',
              endsAt: '2026-11-07T12:00:00.000Z',
              capacity: 0,
            },
          ],
        },
      },
    })

    const result = await workoutService.list()
    expect(result.actorId).toBe(actorId)
    expect(result.items).toHaveLength(1)
    expect(mockedGet).toHaveBeenCalledWith('/desktop/workouts', {
      signal: undefined,
    })
  })
})
