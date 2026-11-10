import type {
  ManagementContext,
  ManagementRole,
} from '@/shared/types/management-context'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { Button } from '@/shared/components/ui/button'

type ContextSelectionProps = {
  contexts: ManagementContext[]
  status: 'loading' | 'error' | 'success'
  onSelect: (context: ManagementContext) => void
  onRetry: () => void
  pendingId?: string
  hasStudentProfile?: boolean
}

const roleLabel: Record<ManagementRole, string> = {
  platform: 'Plataforma',
  academy: 'Academia',
  teacher: 'Professor',
}

const roleTitle: Record<ManagementRole, string> = {
  platform: 'Administrar plataforma',
  academy: 'Gerenciar academia',
  teacher: 'Minhas aulas',
}

export function ContextSelection({
  contexts,
  status,
  onSelect,
  onRetry,
  pendingId,
  hasStudentProfile = false,
}: ContextSelectionProps) {
  return (
    <section aria-labelledby="context-title">
      <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-[#08b9ae]">
        CAVERNA BJJ / CONTEXTOS
      </p>
      <h1 id="context-title" className="text-3xl font-semibold tracking-tight">
        Como você quer entrar?
      </h1>
      <p className="mt-5 text-sm text-muted-foreground">
        Uma conta. Acesso apenas aos perfis e academias autorizados.
      </p>
      <div className="mt-7" aria-live="polite">
        {status === 'loading' && <LoadingState label="Carregando contextos" />}
        {status === 'error' && (
          <ErrorState
            message="Não foi possível carregar seus contextos."
            onRetry={onRetry}
            retryLabel="Tentar novamente"
          />
        )}
        {status === 'success' && contexts.length === 0 && (
          <EmptyState
            title="Nenhum contexto disponível"
            description="Quando houver acesso autorizado, ele aparecerá aqui."
          />
        )}
        {status === 'success' && contexts.length > 0 && (
          <>
            <ul className="grid gap-4 lg:grid-cols-3">
              {contexts.map((context) => (
                <li key={context.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="group h-full min-h-44 w-full flex-col items-stretch justify-between gap-5 rounded-xl border border-border bg-card p-5 text-left shadow-none hover:border-primary/60 hover:bg-card"
                    onClick={() => onSelect(context)}
                    disabled={Boolean(pendingId)}
                    aria-busy={pendingId === context.id}
                    aria-label={`Selecionar ${context.label}, ${roleLabel[context.role]}`}
                  >
                    <span>
                      <span className="block text-lg font-semibold">
                        {roleTitle[context.role]}
                      </span>
                      <span className="mt-3 block text-sm font-normal text-muted-foreground">
                        {context.label}
                      </span>
                      <span className="mt-2 block text-sm font-normal text-muted-foreground">
                        {context.detail}
                      </span>
                    </span>
                    <span className="block rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground group-hover:bg-primary/90">
                      {pendingId === context.id ? 'Validando...' : 'Acessar'}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
            {hasStudentProfile && (
              <div className="mt-5 rounded-xl border border-[#08b9ae] bg-card p-5">
                <h2 className="font-semibold">Seu perfil de aluno</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Sua trilha e suas reservas continuam no aplicativo do aluno.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
