import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listTeachers,
  findTeacher,
  createTeacher,
  updateTeacher,
  removeTeacher,
  type TeacherOption,
  type TeacherInput,
  type TeacherUpdateInput,
} from '@/features/teachers/services/teacher.service'

export const teacherKeys = {
  all: ['teachers'] as const,
  item: (id: string) => ['teachers', id] as const,
}

export function useTeachers() {
  return useQuery({
    queryKey: teacherKeys.all,
    queryFn: ({ signal }) => listTeachers(signal),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: teacherKeys.item(id),
    queryFn: ({ signal }) => findTeacher(id, signal),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useCreateTeacher() {
  const queryClient = useQueryClient()
  return useMutation<TeacherOption, Error, TeacherInput>({
    mutationFn: (input) => createTeacher(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: teacherKeys.all }),
  })
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient()
  return useMutation<
    TeacherOption,
    Error,
    { id: string; input: TeacherUpdateInput }
  >({
    mutationFn: ({ id, input }) => updateTeacher(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
      queryClient.invalidateQueries({ queryKey: teacherKeys.item(id) })
    },
  })
}

export function useRemoveTeacher() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => removeTeacher(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: teacherKeys.all }),
  })
}
