import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { passwordRecoveryService } from '@/features/auth/services/password-recovery.service'
import {
  passwordRecoveryRequestSchema,
  type PasswordRecoveryRequestValues,
} from '@/features/auth/schemas/password-recovery.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { AppError } from '@/shared/types/app-error'

function messageForRecoveryError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.kind === 'rate-limited')
      return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.'
    if (error.kind === 'validation') return 'Informe um e-mail válido.'
    if (error.kind === 'network' || error.kind === 'timeout')
      return 'Não foi possível conectar. Tente novamente.'
  }
  return 'Não foi possível solicitar a recuperação. Tente novamente.'
}

export default function PasswordRecoveryRequestPage() {
  const [sentMessage, setSentMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordRecoveryRequestValues>({
    resolver: zodResolver(passwordRecoveryRequestSchema),
    defaultValues: { email: '' },
  })

  async function submit(values: PasswordRecoveryRequestValues) {
    setSubmitError(null)
    try {
      setSentMessage(await passwordRecoveryService.request(values.email))
    } catch (error) {
      setSubmitError(messageForRecoveryError(error))
    }
  }

  return (
    <main className="management-surface min-h-svh">
      <div className="mx-auto max-w-lg px-6 py-16 lg:pt-[140px]">
        <p className="mb-8 text-sm font-bold tracking-wide text-primary">
          CAVERNA
        </p>
        <section
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
          aria-labelledby="recovery-title"
        >
          <h1 id="recovery-title" className="text-2xl font-semibold">
            Recuperar senha
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe o e-mail da sua conta. Enviaremos um link de uso único para
            redefinir a senha.
          </p>

          {sentMessage ? (
            <div className="mt-6 rounded-lg border border-primary/30 bg-accent p-4">
              <p role="status" className="text-sm font-medium">
                {sentMessage}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Se o e-mail estiver cadastrado, o link chegará em instantes.
                Verifique também a caixa de spam.
              </p>
            </div>
          ) : (
            <form
              className="mt-6 space-y-5"
              onSubmit={handleSubmit(submit)}
              noValidate
            >
              <div className="space-y-2">
                <label htmlFor="recovery-email" className="text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="recovery-email"
                  type="email"
                  autoComplete="username"
                  className="bg-accent"
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? 'recovery-email-error' : undefined
                  }
                  {...register('email')}
                />
                {errors.email && (
                  <p
                    id="recovery-email-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>
              {submitError && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {submitError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {isSubmitting ? 'Enviando…' : 'Enviar link'}
              </Button>
            </form>
          )}

          <Link
            className="mt-5 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            to={routes.login}
          >
            Voltar para o login
          </Link>
        </section>
      </div>
    </main>
  )
}
