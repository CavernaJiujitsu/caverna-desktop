import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import {
  academySchema,
  unitSchema,
  type Academy,
  type AcademyInput,
  type AcademyUnit,
} from '@/features/academies/schemas/academy.schema'

const apiCave = z.object({
  id: z.string(),
  name: z.string(),
  units: z.array(unitSchema).optional(),
})
const listResponse = z.object({ data: z.object({ data: z.array(apiCave) }) })
const itemResponse = z.object({ data: apiCave })
const unitsResponse = z.object({
  data: z.object({ data: z.array(unitSchema) }),
})
const unitResponse = z.object({ data: unitSchema })
export type UnitInput = {
  name: string
  address?: string
  neighborhood?: string
  latitude: number
  longitude: number
}

const linkedPractitionerSchema = z.object({
  id: z.string().uuid(),
  practitionerId: z.string().uuid(),
  practitioner: z.object({
    id: z.string().uuid(),
    user: z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
    }),
  }),
})
const linkedPractitionersResponse = z.object({
  data: z.object({ data: z.array(linkedPractitionerSchema) }),
})

export const academyService = {
  async list(signal?: AbortSignal): Promise<Academy[]> {
    const response = await http.get('/caves', {
      params: { page: 1, limit: 100 },
      signal,
    })
    return listResponse
      .parse(response.data)
      .data.data.map((item) =>
        academySchema.parse({ ...item, units: item.units ?? [] }),
      )
  },
  async create(input: AcademyInput, signal?: AbortSignal): Promise<Academy> {
    const response = await http.post('/caves', input, { signal })
    return academySchema.parse({
      ...itemResponse.parse(response.data).data,
      units: [],
    })
  },
  async update(id: string, input: AcademyInput, signal?: AbortSignal) {
    const response = await http.patch(`/caves/${id}`, input, { signal })
    return academySchema.parse({
      ...itemResponse.parse(response.data).data,
      units: [],
    })
  },
  async remove(id: string, signal?: AbortSignal) {
    await http.delete(`/caves/${id}`, { signal })
  },
  async listUnits(
    caveId: string,
    signal?: AbortSignal,
  ): Promise<AcademyUnit[]> {
    const response = await http.get(`/caves/${caveId}/units`, {
      params: { page: 1, limit: 100 },
      signal,
    })
    return unitsResponse.parse(response.data).data.data
  },
  async createUnit(caveId: string, input: UnitInput, signal?: AbortSignal) {
    const response = await http.post(`/caves/${caveId}/units`, input, {
      signal,
    })
    return unitResponse.parse(response.data).data
  },
  async updateUnit(
    caveId: string,
    unitId: string,
    input: Partial<UnitInput>,
    signal?: AbortSignal,
  ) {
    const response = await http.patch(
      `/caves/${caveId}/units/${unitId}`,
      input,
      { signal },
    )
    return unitResponse.parse(response.data).data
  },
  async removeUnit(caveId: string, unitId: string, signal?: AbortSignal) {
    await http.delete(`/caves/${caveId}/units/${unitId}`, { signal })
  },
  async linkPractitioner(
    caveId: string,
    unitId: string,
    practitionerId: string,
    signal?: AbortSignal,
  ) {
    await http.post(
      `/caves/${caveId}/units/${unitId}/practitioners`,
      { practitionerId },
      { signal },
    )
  },
  async listUnitPractitioners(
    caveId: string,
    unitId: string,
    signal?: AbortSignal,
  ) {
    const response = await http.get(
      `/caves/${caveId}/units/${unitId}/practitioners`,
      { params: { page: 1, limit: 100 }, signal },
    )
    return linkedPractitionersResponse.parse(response.data).data.data
  },
  async unlinkPractitioner(
    caveId: string,
    unitId: string,
    practitionerId: string,
    signal?: AbortSignal,
  ) {
    await http.delete(
      `/caves/${caveId}/units/${unitId}/practitioners/${practitionerId}`,
      { signal },
    )
  },
}
