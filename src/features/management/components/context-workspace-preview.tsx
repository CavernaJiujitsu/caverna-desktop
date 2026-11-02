import { ArrowLeftRight, LogOut } from 'lucide-react'
import { useState } from 'react'
import type {
  ManagementContext,
  ManagementRole,
} from '@/shared/types/management-context'
import { Button } from '@/shared/components/ui/button'

const previewNavigation: Record<ManagementRole, string[]> = {
  platform: ['Visão da plataforma', 'Academias'],
  academy: ['Visão da academia', 'Turmas'],
  teacher: ['Minhas aulas', 'Alunos'],
}

type ContextWorkspacePreviewProps = {
  context: ManagementContext
  onSwitch: () => void
  onExit: () => void
}

export function ContextWorkspacePreview({
  context,
  onSwitch,
  onExit,
}: ContextWorkspacePreviewProps) {
  const [activeArea, setActiveArea] = useState(
    previewNavigation[context.role][0],
  )
  return (
    <section className="mx-auto max-w-5xl" aria-labelledby="workspace-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Prévia de navegação
          </p>
          <h1 id="workspace-title" className="mt-2 text-3xl font-semibold">
            {context.label}
          </h1>
          <p className="mt-2 text-muted-foreground">{context.detail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onSwitch}>
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            Trocar contexto
          </Button>
          <Button type="button" variant="ghost" onClick={onExit}>
            <LogOut className="size-4" aria-hidden="true" />
            Sair da prévia
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">
        <nav
          className="rounded-xl border bg-card p-4"
          aria-label={`Navegação de ${context.label}`}
        >
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Áreas ilustrativas
          </p>
          <ul className="space-y-1">
            {previewNavigation[context.role].map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeArea === item ? 'bg-accent font-medium' : ''}`}
                  aria-current={activeArea === item ? 'page' : undefined}
                  onClick={() => setActiveArea(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="rounded-xl border border-dashed bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{activeArea}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A navegação acima ilustra diferenças entre perfis. Os destinos,
            dados e permissões finais dependem do contrato de contexto e da
            autorização no backend.
          </p>
        </div>
      </div>
    </section>
  )
}
