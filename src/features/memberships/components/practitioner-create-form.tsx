import { LoaderCircle, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  practitionerCreateFormSchema,
  type PractitionerCreateFormValues,
  type PractitionerInput,
} from '@/features/practitioners/schemas/practitioner.schema'
import { useCreatePractitioner } from '@/features/practitioners/hooks/use-practitioners'
import {
  useStudentMemberships,
  useStudentMembershipMutations,
} from '@/features/memberships/hooks/use-memberships'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

export function PractitionerCreateForm({ caveUnitId }: { caveUnitId: string }) {
  const createPractitioner = useCreatePractitioner()
  const memberships = useStudentMemberships(caveUnitId)
  const mutations = useStudentMembershipMutations()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PractitionerCreateFormValues>({
    resolver: zodResolver(practitionerCreateFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: '',
    },
  })

  async function submit(values: PractitionerCreateFormValues) {
    try {
      const age = values.age ? Number(values.age) : undefined
      const practitioner: PractitionerInput = {
        name: values.name,
        email: values.email,
        password: values.password,
        ...(age !== undefined ? { age } : {}),
      }
      const created = await createPractitioner.mutateAsync(practitioner)
      try {
        await mutations.link.mutateAsync({
          practitionerId: created.id,
          caveUnitId,
        })
        notify.success('Aluno cadastrado e matriculado na unidade.')
      } catch {
        notify.warning(
          'Aluno cadastrado, mas não foi possível matricular na unidade.',
        )
      }
      reset()
      void memberships.refetch()
    } catch (error) {
      notify.error(
        messageForError(error, 'Não foi possível cadastrar o aluno.'),
      )
    }
  }

  const isPending =
    isSubmitting || createPractitioner.isPending || mutations.link.isPending

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <div className="flex items-center gap-2">
        <UserPlus className="size-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Cadastrar aluno</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Crie o cadastro do aluno e matricule-o nesta unidade.
      </p>
      <label className="grid gap-2 text-sm font-medium">
        Nome completo
        <Input aria-invalid={Boolean(errors.name)} {...register('name')} />
        {errors.name && (
          <span className="text-xs text-destructive">
            {errors.name.message}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        E-mail
        <Input aria-invalid={Boolean(errors.email)} {...register('email')} />
        {errors.email && (
          <span className="text-xs text-destructive">
            {errors.email.message}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Senha
        <Input
          aria-invalid={Boolean(errors.password)}
          type="password"
          {...register('password')}
        />
        {errors.password && (
          <span className="text-xs text-destructive">
            {errors.password.message}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Confirmar senha
        <Input
          aria-invalid={Boolean(errors.confirmPassword)}
          type="password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <span className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Idade (opcional)
        <Input
          aria-invalid={Boolean(errors.age)}
          type="number"
          {...register('age')}
        />
        {errors.age && (
          <span className="text-xs text-destructive">{errors.age.message}</span>
        )}
      </label>
      <div className="mt-4 flex items-center gap-3">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Limpar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Cadastrar aluno
        </Button>
      </div>
    </form>
  )
}
