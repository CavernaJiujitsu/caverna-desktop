import { LoaderCircle, UserPlus } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  practitionerCreateFormSchema,
  type PractitionerCreateFormValues,
  type PractitionerInput,
} from '@/features/practitioners/schemas/practitioner.schema'
import { useCreatePractitioner } from '@/features/practitioners/hooks/use-practitioners'
import { AddressLocator } from '@/shared/components/address-locator'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { getErrorMessage } from '@/shared/lib/error-message'

export function PractitionerCreateForm() {
  const createPractitioner = useCreatePractitioner()

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PractitionerCreateFormValues>({
    resolver: zodResolver(practitionerCreateFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      address: '',
      latitude: '',
      longitude: '',
    },
  })
  const locationValues = useWatch({ control })

  async function submit(values: PractitionerCreateFormValues) {
    try {
      const latitude = values.latitude ? Number(values.latitude) : undefined
      const longitude = values.longitude ? Number(values.longitude) : undefined
      const practitioner: PractitionerInput = {
        name: values.name,
        email: values.email,
        password: values.password,
        address: values.address,
        ...(latitude !== undefined && longitude !== undefined
          ? { latitude, longitude }
          : {}),
      }
      await createPractitioner.mutateAsync(practitioner)
      notify.success('Aluno cadastrado com sucesso.')
      reset()
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível cadastrar o aluno.'),
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
      <div className="pt-2 border-t border-border">
        <AddressLocator
          id="student"
          value={{
            address: locationValues.address ?? '',
            latitude:
              locationValues.latitude === ''
                ? undefined
                : Number(locationValues.latitude),
            longitude:
              locationValues.longitude === ''
                ? undefined
                : Number(locationValues.longitude),
          }}
          onChange={(location) => {
            setValue('address', location.address, {
              shouldDirty: true,
              shouldValidate: true,
            })
            setValue(
              'latitude',
              location.latitude === undefined ? '' : String(location.latitude),
              { shouldDirty: true, shouldValidate: true },
            )
            setValue(
              'longitude',
              location.longitude === undefined
                ? ''
                : String(location.longitude),
              { shouldDirty: true, shouldValidate: true },
            )
          }}
        />
        {errors.address && (
          <p role="alert" className="text-sm text-destructive">
            {errors.address.message}
          </p>
        )}
        {errors.latitude && (
          <p role="alert" className="text-sm text-destructive">
            {errors.latitude.message}
          </p>
        )}
        {errors.longitude && (
          <p role="alert" className="text-sm text-destructive">
            {errors.longitude.message}
          </p>
        )}
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
