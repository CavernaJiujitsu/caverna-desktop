import { describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import { classService } from './class.service'

vi.mock('@/shared/lib/axios', () => ({ http: { post: vi.fn() } }))

describe('class attendance', () => {
  it('confirma presença pela rota protegida do backend', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: {} })
    await classService.checkIn('class-uuid', 'enrollment-uuid')
    expect(http.post).toHaveBeenCalledWith('/classes/class-uuid/enrollments/enrollment-uuid/check-in')
  })
})
