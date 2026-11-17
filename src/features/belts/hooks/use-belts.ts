import { useQuery } from '@tanstack/react-query'
import { beltService } from '@/features/belts/services/belt.service'

export function useBelts() {
  return useQuery({
    queryKey: ['belts', 'list'] as const,
    queryFn: ({ signal }) => beltService.list(signal),
    staleTime: 10 * 60_000,
    retry: 1,
  })
}
