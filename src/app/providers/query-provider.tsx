import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { queryClient } from '@/shared/lib/query-client'

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <QueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}

const QueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => ({
    default: ReactQueryDevtools,
  })),
)
