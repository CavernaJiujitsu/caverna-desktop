import { useQuery } from '@tanstack/react-query'
import { listClassTeachers, listClassUnits } from '@/features/classes/services/catalog.service'
export function useClassCatalog() {
  const units = useQuery({ queryKey: ['class-catalog', 'units'], queryFn: ({ signal }) => listClassUnits(signal), staleTime: 60_000, retry: 1 })
  const teachers = useQuery({ queryKey: ['class-catalog', 'teachers'], queryFn: ({ signal }) => listClassTeachers(signal), staleTime: 60_000, retry: 1 })
  return { units, teachers }
}
