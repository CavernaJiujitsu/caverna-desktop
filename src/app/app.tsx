import { QueryProvider } from '@/app/providers/query-provider'
import { AppRouterProvider } from '@/app/providers/router-provider'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { SessionProvider } from '@/shared/session/session-context'
import { setupAuthInterceptors } from '@/app/lib/http-interceptors'
import { Toaster } from '@/shared/components/ui/sonner'
import { useEffect } from 'react'
import { useSession } from '@/shared/session/session'

function SessionResponseHandler() {
  const { clearSession, setSelectedContext } = useSession()
  useEffect(
    () =>
      setupAuthInterceptors({
        onUnauthorized: clearSession,
        onForbidden: () => setSelectedContext(null),
      }),
    [clearSession, setSelectedContext],
  )
  return null
}

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SessionProvider>
          <SessionResponseHandler />
          <AppRouterProvider />
          <Toaster />
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
