import {
  ArrowRight,
  Building2,
  CircleAlert,
  GraduationCap,
  LoaderCircle,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
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
  pendingId?: string
  errorMessage?: string | null
  onSelect: (context: ManagementContext) => void
  onRetry: () => void
  onSignOut?: () => void
}

const roleLabel: Record<ManagementRole, string> = {
  platform: 'Plataforma',
  academy: 'Academia',
  teacher: 'Professor',
}

const roleIcon: Record<ManagementRole, LucideIcon> = {
  platform: ShieldCheck,
  academy: Building2,
  teacher: GraduationCap,
}

const roleAccent: Record<ManagementRole, string> = {
  platform: 'border-primary/25 bg-primary/10 text-primary',
  academy: 'border-[#08b9ae]/30 bg-[#08b9ae]/10 text-[#08b9ae]',
  teacher: 'border-[#08b9ae]/30 bg-[#08b9ae]/10 text-[#08b9ae]',
}

function ContextOption({
  context,
  pending,
  disabled,
  onSelect,
}: {
  context: ManagementContext
  pending: boolean
  disabled: boolean
  onSelect: (context: ManagementContext) => void
}) {
  const Icon = roleIcon[context.role]

  return (
    <li>
      <Button
        type="button"
        variant="outline"
        className="group h-auto min-h-20 w-full items-center justify-start gap-4 whitespace-normal rounded-xl border-border bg-background/40 p-4 text-left shadow-none transition-colors hover:border-[#08b9ae]/50 hover:bg-accent/70 focus-visible:border-[#08b9ae] focus-visible:ring-[#08b9ae]/30 disabled:bg-background/20 sm:p-5"
        disabled={disabled}
        onClick={() => onSelect(context)}
        aria-label={`Selecionar ${context.label}, ${roleLabel[context.role]}`}
      >
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg border ${roleAccent[context.role]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {roleLabel[context.role]}
            </span>
            {context.detail ? (
              <>
                <span
                  className="hidden text-muted-foreground/60 sm:inline"
                  aria-hidden="true"
                >
                  ·
                </span>
                <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                  {context.detail}
                </span>
              </>
            ) : null}
          </span>
          <span className="mt-1 block truncate text-base font-semibold text-card-foreground">
            {context.label}
          </span>
          {context.detail ? (
            <span className="mt-0.5 block truncate text-sm text-muted-foreground sm:hidden">
              {context.detail}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
          {pending ? (
            <>
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              <span>Validando…</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Acessar</span>
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </>
          )}
        </span>
      </Button>
    </li>
  )
}

export function ContextSelection({
  contexts,
  status,
  pendingId,
  errorMessage,
  onSelect,
  onRetry,
  onSignOut,
}: ContextSelectionProps) {
  const pending = Boolean(pendingId)
  const hasContexts = status === 'success' && contexts.length > 0

  return (
    <section
      aria-labelledby="context-title"
      className="mx-auto w-full max-w-3xl"
    >
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#08b9ae]">
          Caverna BJJ / Contextos
        </p>
        <h1
          id="context-title"
          className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Como você quer entrar?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Uma conta. Acesso apenas aos perfis e academias autorizados.
        </p>
      </header>

      <div className="mt-8 rounded-2xl border border-border bg-card/80 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/80 px-1 pb-4">
          <div>
            <h2 className="text-base font-semibold">Seus contextos</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Escolha um acesso para continuar.
            </p>
          </div>
          {hasContexts ? (
            <span className="rounded-full border border-[#08b9ae]/30 bg-[#08b9ae]/10 px-2.5 py-1 text-xs font-medium text-[#08b9ae]">
              {contexts.length === 1
                ? '1 disponível'
                : `${contexts.length} disponíveis`}
            </span>
          ) : null}
        </div>

        <div className="mt-4" aria-live="polite">
          {status === 'loading' && (
            <div className="px-1 py-4">
              <LoadingState label="Carregando contextos…" />
            </div>
          )}

          {status === 'error' && (
            <ErrorState
              message="Não foi possível carregar seus contextos."
              onRetry={onRetry}
              retryLabel="Tentar novamente"
            />
          )}

          {errorMessage && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <CircleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {errorMessage}
            </p>
          )}

          {status === 'success' && contexts.length === 0 && (
            <div>
              <EmptyState
                title="Nenhum contexto disponível"
                description="Esta conta não possui um perfil de gestão autorizado. Use o aplicativo do aluno ou fale com a sua academia."
              />
              {onSignOut && (
                <Button
                  className="mt-5"
                  type="button"
                  variant="outline"
                  onClick={onSignOut}
                >
                  Sair e entrar com outra conta
                </Button>
              )}
            </div>
          )}

          {hasContexts && (
            <ul className="grid gap-3" aria-label="Contextos disponíveis">
              {contexts.map((context) => (
                <ContextOption
                  key={context.id}
                  context={context}
                  pending={pendingId === context.id}
                  disabled={pending}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        O contexto escolhido pode ser trocado a qualquer momento dentro do
        painel.
      </p>
    </section>
  )
}
