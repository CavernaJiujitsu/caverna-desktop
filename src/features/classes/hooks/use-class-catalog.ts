import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/shared/session/session'
import {
  listClassTeachers,
  listClassUnits,
} from '@/features/classes/services/catalog.service'
export function useClassCatalog() {
  const { selectedContext } = useSession()
  const units = useQuery({
    queryKey: ['class-catalog', selectedContext?.id, 'units'],
    queryFn: ({ signal }) => listClassUnits(signal, selectedContext),
    staleTime: 60_000,
    retry: 1,
  })
  const teachers = useQuery({
    queryKey: ['class-catalog', selectedContext?.id, 'teachers'],
    queryFn: ({ signal }) => listClassTeachers(signal, selectedContext),
    staleTime: 60_000,
    retry: 1,
  })
  return { units, teachers }
}
