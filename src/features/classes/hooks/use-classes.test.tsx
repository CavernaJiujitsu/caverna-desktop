import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import {
  classKeys,
  useClassMutations,
} from '@/features/classes/hooks/use-classes'
import type {
  ClassFormValues,
  ClassItem,
} from '@/features/classes/schemas/class.schema'
import { classService } from '@/features/classes/services/class.service'

vi.mock('@/features/classes/services/class.service', () => ({
  classService: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))

const listQuery = { caveId: '9157d890-613d-43b8-960a-b090a7af17e2', page: 1 }

const listed: ClassItem = {
  id: '6894218a-cbdb-477c-82c7-b4ed6b934430',
  type: 'EXAM',
  startsAt: '2026-11-14T18:00:00.000Z',
  endsAt: '2026-11-14T19:30:00.000Z',
  capacity: 20,
  caveUnitId: '7ad902c2-4988-47fc-8340-e7bc2dc3b477',
  caveUnitName: 'Consolação',
  caveName: 'Caverna Matriz',
  teacherId: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
  teacherName: 'Juliana Gracie',
  belts: [],
}

const values: ClassFormValues = {
  caveUnitId: listed.caveUnitId,
  teacherId: listed.teacherId,
  type: 'EXAM',
  date: '2026-11-14',
  startTime: '15:00',
  endTime: '16:30',
  capacity: 20,
  beltIds: [],
}

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(classKeys.list(listQuery), {
    items: [listed],
    page: 1,
    totalPages: 1,
    total: 1,
  })
  client.setQueryData(classKeys.item(listed.id), listed)
})

// DEC-backend-1: POST/PATCH /classes and PUT /classes/:id/belts answer with
// `teacher` without `user`. The UI must reload through GET, never show that body.
it('reloads the classes through GET after creating, ignoring the POST body', async () => {
  vi.mocked(classService.create).mockResolvedValue({
    ...listed,
    teacherName: null,
  })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const { result } = renderHook(() => useClassMutations(), { wrapper })

  let saved: unknown = 'not-called'
  await act(async () => {
    saved = await result.current.save.mutateAsync({ values })
  })

  expect(saved).toBeUndefined()
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['classes'] })
  expect(client.getQueryState(classKeys.list(listQuery))?.isInvalidated).toBe(
    true,
  )
  // The cache was not overwritten with the nameless mutation body.
  expect(
    client.getQueryData<{ items: ClassItem[] }>(classKeys.list(listQuery))
      ?.items[0]?.teacherName,
  ).toBe('Juliana Gracie')
})

it('reloads the open class through GET after editing it', async () => {
  vi.mocked(classService.update).mockResolvedValue(undefined)
  const { result } = renderHook(() => useClassMutations(), { wrapper })

  await act(async () => {
    await result.current.save.mutateAsync({
      id: listed.id,
      values,
      previousTeacherId: listed.teacherId,
    })
  })

  expect(classService.update).toHaveBeenCalledWith(
    listed.id,
    values,
    listed.teacherId,
  )
  expect(client.getQueryState(classKeys.item(listed.id))?.isInvalidated).toBe(
    true,
  )
  expect(
    client.getQueryData<ClassItem>(classKeys.item(listed.id))?.teacherName,
  ).toBe('Juliana Gracie')
})
