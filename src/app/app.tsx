import { QueryProvider } from '@/app/providers/query-provider'
import { AppRouterProvider } from '@/app/providers/router-provider'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { Toaster } from '@/shared/components/ui/sonner'

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AppRouterProvider />
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  )
}
