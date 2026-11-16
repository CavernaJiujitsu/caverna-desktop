import { LoaderCircle, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  practitionerCreateFormSchema,
  type PractitionerCreateFormValues,
  type PractitionerInput,
} from '@/features/practitioners/schemas/practitioner.schema'
import { useCreatePractitioner } from '@/features/practitioners/hooks/use-practitioners'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

export function PractitionerCreateForm() {
  const createPractitioner = useCreatePractitioner()

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
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      latitude: '',
      longitude: '',
    },
  })

  async function submit(values: PractitionerCreateFormValues) {
    try {
      const age = values.age ? Number(values.age) : undefined
      const latitude = values.latitude ? Number(values.latitude) : undefined
      const longitude = values.longitude ? Number(values.longitude) : undefined
      const practitioner: PractitionerInput = {
        name: values.name,
        email: values.email,
        password: values.password,
        ...(age !== undefined ? { age } : {}),
        ...(latitude !== undefined && longitude !== undefined
          ? { latitude, longitude }
          : {}),
      }
      await createPractitioner.mutateAsync(practitioner)
      notify.success('Aluno cadastrado com sucesso.')
      reset()
    } catch (error) {
      notify.error(
        messageForError(error, 'Não foi possível cadastrar o aluno.'),
      )
    }
  }

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
        Crie o cadastro do aluno. Após cadastrar, matricule-o em uma unidade na
        tela de alunos.
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
      <div className="pt-2 border-t border-border">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Endereço
        </h3>
        <label className="grid gap-2 text-sm font-medium mt-2">
          Logradouro
          <Input
            aria-invalid={Boolean(errors.address)}
            {...register('address')}
          />
          {errors.address && (
            <span className="text-xs text-destructive">
              {errors.address.message}
            </span>
          )}
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium">
            Número
            <Input
              aria-invalid={Boolean(errors.number)}
              {...register('number')}
            />
            {errors.number && (
              <span className="text-xs text-destructive">
                {errors.number.message}
              </span>
            )}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Complemento
            <Input {...register('complement')} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Bairro
            <Input
              aria-invalid={Boolean(errors.neighborhood)}
              {...register('neighborhood')}
            />
            {errors.neighborhood && (
              <span className="text-xs text-destructive">
                {errors.neighborhood.message}
              </span>
            )}
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium mt-3">
          Cidade
          <Input aria-invalid={Boolean(errors.city)} {...register('city')} />
          {errors.city && (
            <span className="text-xs text-destructive">
              {errors.city.message}
            </span>
          )}
        </label>
      </div>
      <div className="pt-2 border-t border-border">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Coordenadas
        </h3>
        <p className="text-xs text-muted-foreground">
          Preencha latitude e longitude manualmente. A integração com um serviço
          de geocodificação ainda será definida.
        </p>
        <div className="grid gap-3 md:grid-cols-2 mt-2">
          <label className="grid gap-2 text-sm font-medium">
            Latitude
            <Input
              aria-invalid={Boolean(errors.latitude)}
              type="number"
              step="any"
              {...register('latitude')}
            />
            {errors.latitude && (
              <span className="text-xs text-destructive">
                {errors.latitude.message}
              </span>
            )}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Longitude
            <Input
              aria-invalid={Boolean(errors.longitude)}
              type="number"
              step="any"
              {...register('longitude')}
            />
            {errors.longitude && (
              <span className="text-xs text-destructive">
                {errors.longitude.message}
              </span>
            )}
          </label>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Limpar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || createPractitioner.isPending}
        >
          {isSubmitting || createPractitioner.isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Cadastrar aluno
        </Button>
      </div>
    </form>
  )
}
