import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import type { ManagementContext } from '@/shared/types/management-context'

const unitSchema = z.object({ id: z.string(), name: z.string() })
const caveSchema = z.object({ units: z.array(unitSchema).optional() })
const cavesResponse = z.object({
  data: z.object({ data: z.array(caveSchema) }),
})
const caveResponse = z.object({ data: caveSchema })
const scopedUnitResponse = z.object({
  data: z.object({ caveUnitId: z.string().uuid(), caveUnitName: z.string() }),
})
const teachersResponse = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string() })),
})

export async function listClassUnits(
  signal?: AbortSignal,
  context?: ManagementContext | null,
) {
  if (context?.role === 'teacher') {
    const response = await http.get(
      `/management/caves/${context.caveId}/units/${context.caveUnitId}`,
      { signal },
    )
    const unit = scopedUnitResponse.parse(response.data).data
    return [{ id: unit.caveUnitId, name: unit.caveUnitName }]
  }
  if (context?.role === 'academy') {
    const response = await http.get(`/caves/${context.caveId}`, { signal })
    return caveResponse.parse(response.data).data.units ?? []
  }
  const response = await http.get('/caves', {
    params: { page: 1, limit: 100 },
    signal,
  })
  return cavesResponse
    .parse(response.data)
    .data.data.flatMap((cave) => cave.units ?? [])
}

export async function listClassTeachers(
  signal?: AbortSignal,
  context?: ManagementContext | null,
) {
  if (context?.role === 'teacher' && context.teacherId)
    return [{ id: context.teacherId, name: 'Seu perfil de professor' }]
  if (context?.role !== 'platform') return []
  const response = await http.get('/teachers', { signal })
  return teachersResponse.parse(response.data).data
}
