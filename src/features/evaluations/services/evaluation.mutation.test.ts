import { describe, expect, it, vi } from 'vitest'
import { approveEvaluation } from './evaluation.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({ http: { patch: vi.fn() } }))

describe('evaluation mutations', () => {
  it('aprova pela rota real e interpreta o envelope', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: { data: { id: 'e1', status: 'APPROVED' } } })
    await expect(approveEvaluation('e1')).resolves.toMatchObject({ id: 'e1', status: 'APPROVED' })
    expect(http.patch).toHaveBeenCalledWith('/belt-validations/e1/approve', {}, { signal: undefined })
  })
})
