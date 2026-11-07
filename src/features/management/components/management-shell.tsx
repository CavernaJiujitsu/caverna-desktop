import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { Button } from '@/shared/components/ui/button'
import { useSession } from '@/shared/session/session'

const navigation = [
  { to: routes.academies, label: 'Academias' },
  { to: routes.classes, label: 'Aulas' },
  { to: routes.evaluations, label: 'Avaliações' },
] as const

export function ManagementShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { clearSession, selectedContext } = useSession()

  function handleExit() {
    clearSession()
    navigate(routes.login, { replace: true })
  }

  return (
    <div className="management-surface min-h-svh lg:flex">
      <aside className="border-b border-border bg-card px-6 py-6 lg:flex lg:min-h-svh lg:w-60 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <Link
          className="font-bold tracking-wide text-primary"
          to={routes.academies}
        >
          CAVERNA
        </Link>
        <p className="mt-6 text-sm font-medium">
          {selectedContext?.label ?? 'Sessão autenticada'}
        </p>
        {selectedContext?.detail ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedContext.detail}
          </p>
        ) : null}
        <nav className="mt-5 hidden lg:block" aria-label="Áreas de gestão">
          <ul className="space-y-3 text-sm">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-md px-4 py-2.5 ${
                      isActive
                        ? 'bg-primary font-medium text-primary-foreground'
                        : 'bg-accent hover:bg-accent/80'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 flex flex-wrap gap-2 text-sm lg:mt-auto lg:flex-col">
          <Button
            type="button"
            variant="outline"
            className="w-full lg:w-auto"
            onClick={handleExit}
          >
            <LogOut className="size-4 mr-2" aria-hidden="true" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-10 lg:px-10 lg:py-12">
        {children}
      </main>
    </div>
  )
}
