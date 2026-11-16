import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useCaveUnits } from '@/features/academies'
import { useTeacherMutations } from '@/features/teachers/hooks/use-teachers'
import type { Teacher } from '@/features/teachers/schemas/teacher.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

const uuid = z.string().uuid('Informe UUIDs de unidades válidos.')

function parseUnitIds(value: string) {
  return z.array(uuid).safeParse(
    value
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter(Boolean),
  )
}

function unitIdsAreValid(value: string) {
  return parseUnitIds(value).success
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

const createFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe uma senha inicial.'),
  caveUnitId: z.string().uuid('Selecione uma unidade válida.'),
})

type CreateFormValues = z.infer<typeof createFormSchema>

export function TeacherCreateForm({ caveId }: { caveId?: string }) {
  const mutations = useTeacherMutations()
  const unitsQuery = useCaveUnits(caveId ?? '')
  const units = unitsQuery.data?.filter((unit) => unit.active) ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      caveUnitId: '',
    },
  })

  async function submit(values: CreateFormValues) {
    const unit = units.find((u) => u.id === values.caveUnitId)
    try {
      await mutations.create.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        caveUnitIds: [
          { caveUnitId: values.caveUnitId, caveName: unit?.name ?? '' },
        ],
      })
      reset()
      notify.success('Professor criado.')
    } catch (error) {
      notify.error(errorMessage(error, 'Não foi possível criar o professor.'))
    }
  }

  return (
    <form
      className="grid gap-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <div>
        <h2 className="text-lg font-semibold">Novo professor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O professor será associado à caverna inteira.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Nome
        <Input aria-invalid={Boolean(errors.name)} {...register('name')} />
        {errors.name && (
          <span className="text-destructive">{errors.name.message}</span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        E-mail
        <Input
          type="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && (
          <span className="text-destructive">{errors.email.message}</span>
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
          <span className="text-destructive">{errors.password.message}</span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Unidade
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          disabled={
            !caveId ||
            unitsQuery.isPending ||
            unitsQuery.isError ||
            units.length === 0
          }
          aria-invalid={Boolean(errors.caveUnitId)}
          {...register('caveUnitId')}
        >
          <option value="">
            {!caveId
              ? 'Contexto de caverna não selecionado'
              : unitsQuery.isPending
                ? 'Carregando unidades…'
                : 'Selecione uma unidade'}
          </option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        {errors.caveUnitId && (
          <span className="text-destructive">{errors.caveUnitId.message}</span>
        )}
        {unitsQuery.isError && (
          <span className="text-destructive">
            Não foi possível carregar as unidades.
          </span>
        )}
        {!caveId && (
          <span className="text-muted-foreground">
            Selecione o contexto da caverna antes de escolher uma unidade.
          </span>
        )}
        {!unitsQuery.isPending &&
          !unitsQuery.isError &&
          units.length === 0 &&
          caveId && (
            <span className="text-muted-foreground">
              Nenhuma unidade ativa disponível.
            </span>
          )}
      </label>
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
        Criar professor
      </Button>
    </form>
  )
}

const updateFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || z.email().safeParse(value).success,
      'Informe um e-mail válido.',
    ),
  replaceUnits: z.boolean(),
  caveUnitIds: z.string().refine(unitIdsAreValid, 'Informe UUIDs válidos.'),
})

type UpdateFormValues = z.infer<typeof updateFormSchema>

export function TeacherUpdateForm({
  teacher,
  onSaved,
}: {
  teacher: Teacher
  onSaved: () => void
}) {
  const mutations = useTeacherMutations()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      name: teacher.name,
      email: teacher.email ?? '',
      replaceUnits: false,
      caveUnitIds: teacher.caveUnitIds?.join('\n') ?? '',
    },
  })
  const replaceUnits = useWatch({ control, name: 'replaceUnits' })

  async function submit(values: UpdateFormValues) {
    const input: { name?: string; email?: string; caveUnitIds?: string[] } = {}
    if (values.name !== teacher.name) input.name = values.name
    if (values.email !== (teacher.email ?? '')) input.email = values.email
    if (values.replaceUnits) {
      const unitIds = parseUnitIds(values.caveUnitIds)
      if (!unitIds.success) return
      input.caveUnitIds = unitIds.data
    }
    if (Object.keys(input).length === 0) {
      notify.error('Altere ao menos um campo antes de salvar.')
      return
    }
    try {
      await mutations.update.mutateAsync({ teacherId: teacher.id, input })
      notify.success('Professor atualizado.')
      onSaved()
    } catch (error) {
      notify.error(
        errorMessage(error, 'Não foi possível atualizar o professor.'),
      )
    }
  }

  return (
    <form
      className="grid gap-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <h2 className="text-lg font-semibold">Editar professor</h2>
      <label className="grid gap-2 text-sm font-medium">
        Nome
        <Input aria-invalid={Boolean(errors.name)} {...register('name')} />
        {errors.name && (
          <span className="text-destructive">{errors.name.message}</span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        E-mail
        <Input
          type="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && (
          <span className="text-destructive">{errors.email.message}</span>
        )}
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" {...register('replaceUnits')} />
        Substituir vínculos de unidades
      </label>
      {replaceUnits && (
        <label className="grid gap-2 text-sm font-medium">
          UUIDs das unidades
          <textarea
            className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            aria-invalid={Boolean(errors.caveUnitIds)}
            {...register('caveUnitIds')}
          />
          {errors.caveUnitIds && (
            <span className="text-destructive">
              {errors.caveUnitIds.message}
            </span>
          )}
        </label>
      )}
      <Button
        type="submit"
        disabled={isSubmitting || mutations.update.isPending}
      >
        {isSubmitting || mutations.update.isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Salvar alterações
      </Button>
    </form>
  )
}

export function TeacherUnitLinkForm({
  teacherId,
  caveId,
  action,
}: {
  teacherId: string
  caveId: string
  action: 'link' | 'unlink'
}) {
  const mutations = useTeacherMutations()
  const unitsQuery = useCaveUnits(caveId)
  const units = unitsQuery.data?.filter((unit) => unit.active) ?? []
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ caveUnitId: string }>({
    resolver: zodResolver(z.object({ caveUnitId: uuid })),
    defaultValues: { caveUnitId: '' },
  })

  async function submit({ caveUnitId }: { caveUnitId: string }) {
    try {
      const mutation =
        action === 'link' ? mutations.linkUnit : mutations.unlinkUnit
      await mutation.mutateAsync({ teacherId, caveUnitId })
      reset()
      notify.success(
        action === 'link'
          ? 'Professor vinculado à unidade.'
          : 'Professor desvinculado da unidade.',
      )
    } catch (error) {
      notify.error(errorMessage(error, 'Não foi possível alterar o vínculo.'))
    }
  }

  const label =
    action === 'link' ? 'Vincular a uma unidade' : 'Desvincular de uma unidade'
  const pending =
    action === 'link'
      ? mutations.linkUnit.isPending
      : mutations.unlinkUnit.isPending
  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <h2 className="text-lg font-semibold">{label}</h2>
      <label className="grid gap-2 text-sm font-medium">
        Unidade
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          disabled={
            !caveId ||
            unitsQuery.isPending ||
            unitsQuery.isError ||
            units.length === 0
          }
          aria-invalid={Boolean(errors.caveUnitId)}
          {...register('caveUnitId')}
        >
          <option value="">
            {!caveId
              ? 'Contexto de caverna não selecionado'
              : unitsQuery.isPending
                ? 'Carregando unidades…'
                : 'Selecione uma unidade'}
          </option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        {errors.caveUnitId && (
          <span className="text-destructive">{errors.caveUnitId.message}</span>
        )}
        {unitsQuery.isError && (
          <span className="text-destructive">
            Não foi possível carregar as unidades.
          </span>
        )}
        {!caveId && (
          <span className="text-destructive">
            Selecione o contexto da caverna antes de vincular uma unidade.
          </span>
        )}
        {!unitsQuery.isPending && !unitsQuery.isError && units.length === 0 && (
          <span className="text-muted-foreground">
            Nenhuma unidade ativa disponível.
          </span>
        )}
      </label>
      <Button
        type="submit"
        variant={action === 'unlink' ? 'outline' : 'default'}
        disabled={isSubmitting || pending}
      >
        {label}
      </Button>
    </form>
  )
}
