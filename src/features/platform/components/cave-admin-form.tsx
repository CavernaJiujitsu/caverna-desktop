import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCaveAdminMutations } from '@/features/platform/hooks/use-platform-caves'
import {
  createCaveAdminSchema,
  type CaveAdminFormInput,
  type CreateCaveAdminInput,
} from '@/features/platform/schemas/cave.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

function messageForAdminError(error: unknown): string {
  if (error instanceof AppError) return error.message
  return 'Não foi possível salvar o gestor. Tente novamente.'
}

export function CaveAdminForm({
  caveId,
  onSuccess,
}: {
  caveId: string
  onSuccess?: () => void
}) {
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const mutations = useCaveAdminMutations(caveId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CaveAdminFormInput, unknown, CreateCaveAdminInput>({
    resolver: zodResolver(createCaveAdminSchema),
    defaultValues: { name: '', email: '', password: '', userId: undefined },
  })

  async function submit(input: CreateCaveAdminInput) {
    try {
      await mutations.create.mutateAsync(input)
      notify.success('Administrador vinculado à caverna.')
      reset({ name: '', email: '', password: '', userId: undefined })
      onSuccess?.()
    } catch (error) {
      notify.error(messageForAdminError(error))
    }
  }

  function changeMode(next: 'new' | 'existing') {
    setMode(next)
    reset({ name: '', email: '', password: '', userId: undefined })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submit)} noValidate>
      <div role="tablist" aria-label="Tipo de administrador">
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'new'}
            aria-controls="new-account-panel"
            id="new-account-tab"
            className="border-b-2 border-transparent px-3 py-2 text-sm font-medium aria-selected:border-primary aria-selected:text-primary"
            onClick={() => changeMode('new')}
          >
            Nova conta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'existing'}
            aria-controls="existing-account-panel"
            id="existing-account-tab"
            className="border-b-2 border-transparent px-3 py-2 text-sm font-medium aria-selected:border-primary aria-selected:text-primary"
            onClick={() => changeMode('existing')}
          >
            Conta existente
          </button>
        </div>
      </div>

      {mode === 'new' ? (
        <div
          id="new-account-panel"
          role="tabpanel"
          aria-labelledby="new-account-tab"
          className="grid gap-4"
        >
          <label className="grid gap-2 text-sm font-medium">
            Nome
            <Input
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <span role="alert" className="text-xs text-destructive">
                {errors.name.message}
              </span>
            )}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            E-mail
            <Input
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <span role="alert" className="text-xs text-destructive">
                {errors.email.message}
              </span>
            )}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Senha inicial
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <span role="alert" className="text-xs text-destructive">
                {errors.password.message}
              </span>
            )}
          </label>
        </div>
      ) : (
        <div
          id="existing-account-panel"
          role="tabpanel"
          aria-labelledby="existing-account-tab"
        >
          <label className="grid gap-2 text-sm font-medium">
            ID da conta existente
            <Input
              placeholder="00000000-0000-0000-0000-000000000000"
              aria-invalid={!!errors.userId}
              {...register('userId', {
                setValueAs: (value: string) =>
                  value.trim() === '' ? undefined : value.trim(),
              })}
            />
            {errors.userId && (
              <span role="alert" className="text-xs text-destructive">
                {errors.userId.message}
              </span>
            )}
          </label>
        </div>
      )}

      {errors.root?.message && (
        <p role="alert" className="text-xs text-destructive">
          {errors.root.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || mutations.create.isPending}
      >
        {isSubmitting || mutations.create.isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {mode === 'new' ? 'Criar e vincular' : 'Vincular conta'}
      </Button>
    </form>
  )
}
