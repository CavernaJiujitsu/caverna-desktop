import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { Button } from '@/shared/components/ui/button'

export default function AccessDeniedPage() {
  return (
    <ManagementShell>
      <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-[#08b9ae]">
        CAVERNA BJJ / ACESSO
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Você não tem acesso
      </h1>
      <p className="mt-5 text-sm text-muted-foreground">
        Este perfil não está autorizado a consultar estes dados.
      </p>
      <section
        className="mt-7 max-w-4xl rounded-xl border border-border bg-card p-6"
        aria-labelledby="denied-action-title"
      >
        <h2 id="denied-action-title" className="text-lg font-semibold">
          Escolha um contexto autorizado
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Se você participa de outra academia ou possui outro perfil, troque o
          contexto para continuar.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:max-w-52">
          <Button asChild>
            <Link to={routes.managementPreview}>Trocar contexto</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to={routes.login}>Voltar para entrada</Link>
          </Button>
        </div>
      </section>
    </ManagementShell>
  )
}
