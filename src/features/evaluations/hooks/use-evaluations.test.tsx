import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import type { ClassItem } from '@/features/classes/schemas/class.schema'
import { classService } from '@/features/classes/services/class.service'
import { useValidationClassOptions } from '@/features/evaluations/hooks/use-evaluations'

vi.mock('@/features/classes/services/class.service', () => ({
  classService: { list: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function classItem(id: string, type: ClassItem['type']): ClassItem {
  return {
    id,
    type,
    startsAt: '2026-11-20T22:00:00.000Z',
    endsAt: '2026-11-20T23:30:00.000Z',
    capacity: 20,
    caveUnitId: 'unit-fora-da-lista',
    caveUnitName: 'Consolação',
    caveName: 'Caverna Matriz',
    teacherId: 'teacher-1',
    teacherName: 'Juliana Gracie',
    belts: [],
  }
}

beforeEach(() => vi.clearAllMocks())

it('asks the API for the academy cave classes and keeps only hostable types', async () => {
  vi.mocked(classService.list).mockResolvedValue([
    classItem('regular', 'SCHEDULED'),
    classItem('validacao', 'VALIDATION'),
    classItem('exame', 'EXAM'),
  ])

  const { result } = renderHook(
    () => useValidationClassOptions({ caveId: 'cave-1' }, true),
    { wrapper },
  )

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(classService.list).toHaveBeenCalledWith(
    expect.objectContaining({ caveId: 'cave-1', teacherId: undefined }),
    expect.anything(),
  )
  // Units are not filtered on the client: the cave scope comes from the API.
  expect(result.current.data?.map((item) => item.id)).toEqual([
    'regular',
    'validacao',
  ])
})
