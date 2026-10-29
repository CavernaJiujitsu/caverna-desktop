import { Link, Outlet } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ThemeToggle } from '@/app/providers/theme-toggle'

export function AuthLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link className="font-semibold" to={routes.home}>
            Caverna Desktop
          </Link>
          <nav className="flex items-center gap-4" aria-label="Main navigation">
            <Link to={routes.login}>Login</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
