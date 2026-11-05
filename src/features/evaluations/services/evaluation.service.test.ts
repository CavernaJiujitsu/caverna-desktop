import { expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import { getLocalDateInputValue, listEvaluations } from '@/features/evaluations/services/evaluation.service'

it('sends the backend queue filters and parses the envelope', async () => {
  vi.spyOn(http, 'get').mockResolvedValueOnce({
    data: {
      data: {
        data: [{ id: 'evaluation-1', status: 'SCHEDULED', scheduledAt: null }],
      },
    },
  } as never)

  await expect(listEvaluations({ date: '2026-11-05', teacherId: 'teacher-1' })).resolves.toHaveLength(1)
  expect(http.get).toHaveBeenCalledWith('/belt-validations', expect.objectContaining({
    params: expect.objectContaining({ date: '2026-11-05', teacherId: 'teacher-1' }),
  }))
})

it('derives a local date input without a fixed calendar date', () => {
  expect(getLocalDateInputValue(new Date(2026, 10, 5))).toBe('2026-11-05')
})
