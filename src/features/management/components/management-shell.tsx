import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'

export function ManagementShell({ children }: { children: ReactNode }) {
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
          Administrador · prévia
        </p>
        <nav
          className="mt-5 hidden lg:block"
          aria-label="Áreas ilustrativas de gestão"
        >
          <ul className="space-y-3 text-sm">
            <li className="rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground">
              Aulas
            </li>
            <li className="rounded-md bg-accent px-4 py-2.5">Alunos</li>
            <li className="rounded-md bg-accent px-4 py-2.5">Professores</li>
            <li className="rounded-md bg-accent px-4 py-2.5">Unidades</li>
          </ul>
        </nav>
        <p className="mt-8 hidden text-sm text-muted-foreground lg:block">
          Contexto de exemplo
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm lg:flex-col">
          <Link
            className="rounded-md bg-accent px-4 py-2.5 text-center hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            to={routes.managementPreview}
          >
            Trocar contexto
          </Link>
          <Link
            className="rounded-md bg-accent px-4 py-2.5 text-center hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            to={routes.login}
          >
            Sair da prévia
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-10 lg:px-10 lg:py-12">
        {children}
      </main>
    </div>
  )
}
