import { useQuery } from '@tanstack/react-query'
import { listTeachers } from '@/features/teachers/services/teacher.service'

export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: ({ signal }) => listTeachers(signal),
    staleTime: 60_000,
    retry: 1,
  })
}
