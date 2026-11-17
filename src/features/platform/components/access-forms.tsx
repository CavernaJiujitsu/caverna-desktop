import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, UserPlus } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { AccessScopeFields } from '@/features/platform/components/access-scope-fields'
import { useUserAccessMutations } from '@/features/platform/hooks/use-platform-users'
import {
  createManagementUserFormSchema,
  grantAccessFormSchema,
  grantableRoles,
  toGrantAccessInput,
  type CreateManagementUserFormValues,
  type GrantAccessFormValues,
  type ManagementAccessRole,
  type UserAccessView,
} from '@/features/platform/schemas/user.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'

export function GrantAccessForm({
  access,
  roleOptions,
}: {
  access: UserAccessView
  roleOptions: ManagementAccessRole[]
}) {
  const mutations = useUserAccessMutations()
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GrantAccessFormValues>({
    resolver: zodResolver(grantAccessFormSchema),
    defaultValues: { role: roleOptions[0], caveId: '', caveUnitIds: [] },
  })
  const [role, caveId, caveUnitIds] = useWatch({
    control,
    name: ['role', 'caveId', 'caveUnitIds'],
  })

  async function submit(values: GrantAccessFormValues) {
    try {
      await mutations.grant.mutateAsync({
        userId: access.userId,
        input: toGrantAccessInput(values),
      })
      notify.success('Acesso concedido.')
      reset({ role: roleOptions[0], caveId: '', caveUnitIds: [] })
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível conceder o acesso.'),
      )
    }
  }

  const pending = isSubmitting || mutations.grant.isPending
  return (
    <form
      className="grid gap-4 rounded-lg border border-border p-4"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
      aria-labelledby="grant-access-title"
    >
      <h3 id="grant-access-title" className="text-sm font-semibold">
        Conceder acesso
      </h3>
      <AccessScopeFields
        idPrefix="grant"
        values={{ role, caveId, caveUnitIds }}
        roleOptions={roleOptions}
        errors={{
          role: errors.role?.message,
          caveId: errors.caveId?.message,
          caveUnitIds: errors.caveUnitIds?.message,
        }}
        onChange={(next) => {
          setValue('role', next.role)
          setValue('caveId', next.caveId)
          setValue('caveUnitIds', next.caveUnitIds)
        }}
      />
      <Button type="submit" disabled={pending}>
        {pending && (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        )}
        Conceder acesso
      </Button>
    </form>
  )
}

export function ManagementUserForm({
  actorIsRoot,
  onCreated,
  onCancel,
}: {
  actorIsRoot: boolean
  onCreated: (userId: string) => void
  onCancel: () => void
}) {
  const roleOptions = grantableRoles(actorIsRoot)
  const mutations = useUserAccessMutations()
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateManagementUserFormValues>({
    resolver: zodResolver(createManagementUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: roleOptions[0],
      caveId: '',
      caveUnitIds: [],
    },
  })
  const [role, caveId, caveUnitIds] = useWatch({
    control,
    name: ['role', 'caveId', 'caveUnitIds'],
  })

  async function submit(values: CreateManagementUserFormValues) {
    try {
      const created = await mutations.create.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        ...toGrantAccessInput(values),
      })
      notify.success('Usuário de gestão criado.')
      onCreated(created.userId)
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível criar o usuário.'))
    }
  }

  const pending = isSubmitting || mutations.create.isPending
  return (
    <form
      className="grid gap-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
      aria-labelledby="management-user-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="management-user-title" className="text-lg font-semibold">
            Novo usuário de gestão
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cria a conta já com o acesso escolhido.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Fechar
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Nome
          <Input aria-invalid={Boolean(errors.name)} {...register('name')} />
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
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
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
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && (
            <span role="alert" className="text-xs text-destructive">
              {errors.password.message}
            </span>
          )}
        </label>
      </div>
      <AccessScopeFields
        idPrefix="new-user"
        values={{ role, caveId, caveUnitIds }}
        roleOptions={roleOptions}
        errors={{
          role: errors.role?.message,
          caveId: errors.caveId?.message,
          caveUnitIds: errors.caveUnitIds?.message,
        }}
        onChange={(next) => {
          setValue('role', next.role)
          setValue('caveId', next.caveId)
          setValue('caveUnitIds', next.caveUnitIds)
        }}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="size-4" aria-hidden="true" />
          )}
          Criar usuário
        </Button>
      </div>
    </form>
  )
}
