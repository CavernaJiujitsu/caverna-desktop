import { expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import { listTeachers } from '@/features/teachers/services/teacher.service'

it('loads teacher UUIDs from the backend contract', async () => {
  vi.spyOn(http, 'get').mockResolvedValueOnce({
    data: { data: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Rafael Souza' }] },
  } as never)

  await expect(listTeachers()).resolves.toEqual([
    { id: '11111111-1111-4111-8111-111111111111', name: 'Rafael Souza' },
  ])
  expect(http.get).toHaveBeenCalledWith('/teachers', { signal: undefined })
})
