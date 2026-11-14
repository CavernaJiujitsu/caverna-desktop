import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  teacherService,
  type TeacherListQuery,
} from '@/features/teachers/services/teacher.service'
import type {
  TeacherCreateInput,
  TeacherUpdateInput,
} from '@/features/teachers/schemas/teacher.schema'

export const teacherKeys = {
  all: ['teachers'] as const,
  list: (query: TeacherListQuery) => ['teachers', 'list', query] as const,
  item: (id: string) => ['teachers', id] as const,
}

export function useTeachers(query: TeacherListQuery = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: teacherKeys.list(query),
    queryFn: ({ signal }) => teacherService.list(query, signal),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: teacherKeys.item(id),
    queryFn: ({ signal }) => teacherService.findOne(id, signal),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useTeacherOptions(caveId?: string, enabled = Boolean(caveId)) {
  return useQuery({
    queryKey: ['teachers', 'options', caveId] as const,
    queryFn: async ({ signal }) => {
      const firstPage = await teacherService.list(
        { page: 1, limit: 20, ...(caveId ? { caveId } : {}) },
        signal,
      )
      const teachers = [...firstPage.items]
      for (let page = 2; page <= firstPage.totalPage; page += 1) {
        const response = await teacherService.list(
          { page, limit: 20, ...(caveId ? { caveId } : {}) },
          signal,
        )
        teachers.push(...response.items)
      }
      return teachers
    },
    enabled,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useTeacherMutations() {
  const queryClient = useQueryClient()
  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: teacherKeys.all })

  return {
    create: useMutation({
      mutationFn: (input: TeacherCreateInput) => teacherService.create(input),
      onSuccess: invalidateAll,
    }),
    update: useMutation({
      mutationFn: ({
        teacherId,
        input,
      }: {
        teacherId: string
        input: TeacherUpdateInput
      }) => teacherService.update(teacherId, input),
      onSuccess: (_, variables) => {
        invalidateAll()
        queryClient.invalidateQueries({
          queryKey: teacherKeys.item(variables.teacherId),
        })
      },
    }),
    remove: useMutation({
      mutationFn: (teacherId: string) => teacherService.remove(teacherId),
      onSuccess: invalidateAll,
    }),
    linkUnit: useMutation({
      mutationFn: ({
        teacherId,
        caveUnitId,
      }: {
        teacherId: string
        caveUnitId: string
      }) => teacherService.linkUnit(teacherId, caveUnitId),
      onSuccess: invalidateAll,
    }),
    unlinkUnit: useMutation({
      mutationFn: ({
        teacherId,
        caveUnitId,
      }: {
        teacherId: string
        caveUnitId: string
      }) => teacherService.unlinkUnit(teacherId, caveUnitId),
      onSuccess: invalidateAll,
    }),
  }
}
