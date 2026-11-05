import { z } from 'zod'
import { http } from '@/shared/lib/axios'
const cavesResponse = z.object({ data: z.object({ data: z.array(z.object({ units: z.array(z.object({ id: z.string(), name: z.string() })).optional() })) }) })
const teachersResponse = z.object({ data: z.array(z.object({ id: z.string(), name: z.string() })) })
export async function listClassUnits(signal?: AbortSignal) { const response = await http.get('/caves', { params: { page: 1, limit: 100 }, signal }); return cavesResponse.parse(response.data).data.data.flatMap((cave) => cave.units ?? []) }
export async function listClassTeachers(signal?: AbortSignal) { const response = await http.get('/teachers', { signal }); return teachersResponse.parse(response.data).data }
