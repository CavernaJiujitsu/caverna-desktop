import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { LoginForm } from '@/features/auth/components/login-form'
import { notify } from '@/shared/lib/notifications'

export default function LoginPage() {
  return (
    <main className="management-surface min-h-svh">
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-16 lg:grid-cols-[1fr_400px] lg:gap-20 lg:px-[100px] lg:pt-[140px]">
        <section className="max-w-lg">
          <p className="mb-8 text-sm font-bold tracking-wide text-primary">
            CAVERNA
          </p>
          <h1 className="max-w-md text-4xl font-semibold tracking-tight">
            O próximo passo começa na gestão.
          </h1>
          <p className="mt-8 max-w-lg text-lg font-medium leading-relaxed text-muted-foreground">
            Organize suas aulas, acompanhe os alunos e reconheça cada conquista
            no tatame.
          </p>
          <span className="mt-7 inline-flex rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-[#08b9ae]">
            Gestão da academia
          </span>
          <div className="mt-12 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <LockKeyhole
                className="mt-0.5 size-5 shrink-0 text-foreground"
                aria-hidden="true"
              />
              <p>
                Prévia de interface. O envio de credenciais e a verificação de
                sessão serão ativados após a integração com a API.
              </p>
            </div>
          </div>
        </section>
        <section
          className="h-fit rounded-xl border border-border bg-card p-6 shadow-sm"
          aria-labelledby="login-title"
        >
          <div className="mb-6">
            <h2 id="login-title" className="text-xl font-semibold">
              Entre na sua conta
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use o mesmo login para acessar seus perfis autorizados.
            </p>
          </div>
          <LoginForm
            onSubmit={async () => {
              notify.info(
                'A autenticação estará disponível após a integração com a API.',
              )
            }}
          />
          <p className="mt-5 text-xs text-muted-foreground">
            Sua academia ou perfil será selecionado após entrar.
          </p>
          <div className="mt-6 border-t pt-5 text-sm">
            <Link
              className="inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline"
              to={routes.managementPreview}
            >
              Explorar prévia dos contextos{' '}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
