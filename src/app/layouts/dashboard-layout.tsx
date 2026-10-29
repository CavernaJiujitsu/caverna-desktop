import { Link, Outlet } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ThemeToggle } from '@/app/providers/theme-toggle'

export function DashboardLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b px-4 py-4">
        <nav
          className="mx-auto flex max-w-5xl items-center gap-6"
          aria-label="Application navigation"
        >
          <Link to={routes.home}>Caverna Desktop</Link>
          <Link to={routes.dashboard}>Dashboard</Link>
          <Link to={routes.academies}>Academies</Link>
          <ThemeToggle />
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
