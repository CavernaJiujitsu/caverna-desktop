import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { Button } from '@/shared/components/ui/button'
import { useSession } from '@/shared/session/session'

export function ManagementShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { clearSession } = useSession()

  function handleExit() {
    clearSession()
    navigate(routes.login, { replace: true })
  }

  return (
    <div className="management-surface min-h-svh lg:flex">
      <aside className="border-b border-border bg-card px-6 py-6 lg:min-h-svh lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <Link
          className="font-bold tracking-wide text-primary"
          to={routes.login}
        >
          CAVERNA
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">
          Administrador · contexto selecionado
        </p>
        <nav className="mt-5 hidden lg:block" aria-label="Áreas de gestão">
          <ul className="space-y-3 text-sm">
            <li className="rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground">
              <Link to={routes.classesPreview}>Aulas</Link>
            </li>
            <li className="rounded-md bg-accent px-4 py-2.5">Alunos</li>
            <li className="rounded-md bg-accent px-4 py-2.5">Professores</li>
            <li className="rounded-md bg-accent px-4 py-2.5">Unidades</li>
          </ul>
        </nav>
        <div className="mt-auto flex flex-wrap gap-2 text-sm lg:flex-col">
          <div className="h-16 w-full lg:hidden" aria-hidden="true" />
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
