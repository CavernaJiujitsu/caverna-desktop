import { useQuery } from '@tanstack/react-query'
import { beltService } from '@/features/belts/services/belt.service'

export const beltKeys = {
  all: ['belts'] as const,
  list: () => ['belts', 'list'] as const,
  item: (id: string) => ['belts', id] as const,
}

export function useBelts() {
  return useQuery({
    queryKey: beltKeys.list(),
    queryFn: ({ signal }) => beltService.list(signal),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useBelt(id: string) {
  return useQuery({
    queryKey: beltKeys.item(id),
    queryFn: ({ signal }) => beltService.findOne(id, signal),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 1,
  })
}
