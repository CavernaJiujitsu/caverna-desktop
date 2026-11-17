import { ArrowLeftRight, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { Button } from '@/shared/components/ui/button'
import { useSession } from '@/shared/session/session'
import type { ManagementRole } from '@/shared/types/management-context'

type NavigationItem = { to: string; label: string }

const navigationByRole: Record<ManagementRole, NavigationItem[]> = {
  platform: [
    { to: routes.platformCaves, label: 'Cavernas' },
    { to: routes.units, label: 'Unidades' },
    { to: routes.platformUsers, label: 'Usuários e acessos' },
    { to: routes.caveAdministrators, label: 'Administradores' },
    { to: routes.teachers, label: 'Professores' },
    { to: routes.memberships, label: 'Alunos' },
    { to: routes.trainings, label: 'Treinos' },
  ],
  academy: [
    { to: routes.trainings, label: 'Treinos' },
    { to: routes.classes, label: 'Aulas' },
    { to: routes.schedules, label: 'Horários' },
    { to: routes.evaluations, label: 'Validações de faixa' },
    { to: routes.memberships, label: 'Alunos' },
    { to: routes.teachers, label: 'Professores' },
    { to: routes.units, label: 'Unidades' },
    { to: routes.caveAdministrators, label: 'Administradores' },
  ],
  teacher: [
    { to: routes.classes, label: 'Minhas aulas' },
    { to: routes.schedules, label: 'Horários' },
    { to: routes.evaluations, label: 'Validações' },
  ],
}

export function ManagementShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { clearSession, selectedContext, setSelectedContext, session } =
    useSession()
  const navigation = selectedContext
    ? navigationByRole[selectedContext.role]
    : []
  const isRoot = session?.roles.includes('ROOT') ?? false
  const homeDestination = navigation[0]?.to ?? routes.management

  function handleExit() {
    clearSession()
    navigate(routes.login, { replace: true })
  }

  function handleSwitchContext() {
    setSelectedContext(null)
    navigate(routes.management)
  }

  return (
    <div className="management-surface min-h-svh lg:flex">
      <aside className="border-b border-border bg-card px-6 py-6 lg:flex lg:min-h-svh lg:w-60 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <Link
          className="font-bold tracking-wide text-primary"
          to={homeDestination}
        >
          CAVERNA
        </Link>
        <p className="mt-6 flex flex-wrap items-center gap-2 text-sm font-medium">
          {selectedContext?.label ?? 'Sessão autenticada'}
          {isRoot ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
              Root
            </span>
          ) : null}
        </p>
        {session?.user.name ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {session.user.name}
          </p>
        ) : null}
        {selectedContext?.detail ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedContext.detail}
          </p>
        ) : null}
        <nav className="mt-5" aria-label="Áreas de gestão">
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
          {selectedContext && (
            <Button
              type="button"
              variant="ghost"
              className="w-full lg:w-auto"
              onClick={handleSwitchContext}
            >
              <ArrowLeftRight className="size-4 mr-2" aria-hidden="true" />
              Trocar contexto
            </Button>
          )}
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
