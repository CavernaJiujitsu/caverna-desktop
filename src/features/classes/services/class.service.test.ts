import { describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import { classService } from './class.service'

vi.mock('@/shared/lib/axios', () => ({ http: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

const apiClass = { id: 'c1', type: 'SCHEDULED', startsAt: '2026-11-05T22:00:00.000Z', endsAt: '2026-11-05T23:00:00.000Z', capacity: 20, caveUnit: { id: 'unit-uuid', name: 'Centro' }, teacher: { id: 'teacher-uuid', user: { name: 'Professor' } }, belts: [], enrollments: [] }

describe('classService', () => {
  it('lista classes reais e filtra a data local', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: { data: { data: [apiClass] } } })
    await expect(classService.list({ unitId: '', date: '2026-11-05' })).resolves.toHaveLength(1)
    expect(http.get).toHaveBeenCalledWith('/classes', expect.objectContaining({ params: expect.objectContaining({ caveUnitId: undefined }) }))
  })

  it('converte o formulário para o contrato real de criação', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: { data: apiClass } })
    await classService.create({ unitId: 'unit-uuid', teacherId: 'teacher-uuid', date: '2026-11-05', startsAt: '19:00', endsAt: '20:00', capacity: 20, type: 'regular', eligibleBelts: ['white'], movementIds: [] })
    expect(http.post).toHaveBeenCalledWith('/classes', expect.objectContaining({ caveUnitId: 'unit-uuid', teacherId: 'teacher-uuid', type: 'SCHEDULED', beltIds: [] }))
  })
})
