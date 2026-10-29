import { QueryClient } from '@tanstack/react-query'
import { AppError } from '@/shared/types/app-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) =>
        failureCount < 2 &&
        (!(error instanceof AppError) ||
          ['network', 'timeout', 'server'].includes(error.kind)),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
})
