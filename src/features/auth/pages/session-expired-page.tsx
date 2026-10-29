import { Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { Button } from '@/shared/components/ui/button'

export default function SessionExpiredPage() {
  return (
    <main className="management-surface flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-xl">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-accent">
          <Clock3 className="size-8" aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Sessão expirada
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Entre novamente para continuar.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Por segurança, esta sessão não está mais disponível. Nenhum dado de
          gestão pode ser exibido até uma nova autenticação.
        </p>
        <Button asChild className="mt-8">
          <Link to={routes.login}>Ir para entrada</Link>
        </Button>
      </div>
    </main>
  )
}
