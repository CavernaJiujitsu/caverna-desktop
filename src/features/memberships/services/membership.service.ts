import { z } from 'zod'
import { envelopeSchema } from '@/shared/lib/api-schema'
import { http, normalizeHttpError } from '@/shared/lib/axios'
import {
  studentMembershipSchema,
  type StudentMembership,
} from '@/features/memberships/schemas/membership.schema'

const ENDPOINTS = {
  students: '/memberships/students/cave-units',
  studentsByUnit: (caveUnitId: string) =>
    `/memberships/students/cave-units/${caveUnitId}/practitioners`,
  student: (practitionerId: string, caveUnitId: string) =>
    `/memberships/students/cave-units/${practitionerId}/${caveUnitId}`,
} as const

const studentsSchema = envelopeSchema(z.array(studentMembershipSchema))

export const membershipService = {
  async listStudents(
    caveUnitId: string,
    signal?: AbortSignal,
  ): Promise<StudentMembership[]> {
    try {
      const { data } = await http.get<unknown>(
        ENDPOINTS.studentsByUnit(caveUnitId),
        { signal },
      )
      return studentsSchema.parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async linkStudent(practitionerId: string, caveUnitId: string): Promise<void> {
    try {
      await http.post(ENDPOINTS.students, { practitionerId, caveUnitId })
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },

  async unlinkStudent(
    practitionerId: string,
    caveUnitId: string,
  ): Promise<void> {
    try {
      await http.delete(ENDPOINTS.student(practitionerId, caveUnitId))
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
