import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { passwordRecoveryService } from '@/features/auth/services/password-recovery.service'
import {
  passwordResetSchema,
  type PasswordResetValues,
} from '@/features/auth/schemas/password-recovery.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { AppError } from '@/shared/types/app-error'

function messageForResetError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.kind === 'unauthorized')
      return 'Link de recuperação inválido ou expirado. Solicite um novo.'
    if (error.kind === 'validation')
      return 'A nova senha não atende aos requisitos.'
    if (error.kind === 'rate-limited')
      return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.'
    if (error.kind === 'network' || error.kind === 'timeout')
      return 'Não foi possível conectar. Tente novamente.'
  }
  return 'Não foi possível redefinir a senha. Tente novamente.'
}

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function submit(values: PasswordResetValues) {
    setSubmitError(null)
    try {
      await passwordRecoveryService.reset(token, values.password)
      setDone(true)
    } catch (error) {
      setSubmitError(messageForResetError(error))
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
          aria-labelledby="reset-title"
        >
          <h1 id="reset-title" className="text-2xl font-semibold">
            Nova senha
          </h1>

          {!token ? (
            <div className="mt-4">
              <p role="alert" className="text-sm text-destructive">
                Link de recuperação inválido ou expirado.
              </p>
              <Button asChild className="mt-5" variant="outline">
                <Link to={routes.passwordRecovery}>Solicitar novo link</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="mt-4">
              <p role="status" className="text-sm font-medium">
                Senha redefinida com sucesso.
              </p>
              <Button asChild className="mt-5">
                <Link to={routes.login}>Entrar com a nova senha</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Escolha uma senha com pelo menos 8 caracteres.
              </p>
              <form
                className="mt-6 space-y-5"
                onSubmit={handleSubmit(submit)}
                noValidate
              >
                <div className="space-y-2">
                  <label
                    htmlFor="reset-password"
                    className="text-sm font-medium"
                  >
                    Nova senha
                  </label>
                  <Input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    className="bg-accent"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? 'reset-password-error' : undefined
                    }
                    {...register('password')}
                  />
                  {errors.password && (
                    <p
                      id="reset-password-error"
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="reset-confirm-password"
                    className="text-sm font-medium"
                  >
                    Confirmar nova senha
                  </label>
                  <Input
                    id="reset-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className="bg-accent"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword
                        ? 'reset-confirm-password-error'
                        : undefined
                    }
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p
                      id="reset-confirm-password-error"
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errors.confirmPassword.message}
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {isSubmitting ? 'Salvando…' : 'Redefinir senha'}
                </Button>
              </form>
            </>
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
