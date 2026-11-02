import { QueryProvider } from '@/app/providers/query-provider'
import { AppRouterProvider } from '@/app/providers/router-provider'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { SessionProvider } from '@/shared/session/session-context'
import { setupAuthInterceptors } from '@/app/lib/http-interceptors'
import { Toaster } from '@/shared/components/ui/sonner'

setupAuthInterceptors()

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SessionProvider>
          <AppRouterProvider />
          <Toaster />
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
