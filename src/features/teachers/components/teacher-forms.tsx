import { zodResolver } from '@hookform/resolvers/zod'
import { Info, LoaderCircle } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useCaveUnits } from '@/features/academies'
import { useTeacherMutations } from '@/features/teachers/hooks/use-teachers'
import type { Teacher } from '@/features/teachers/schemas/teacher.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'
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

const createFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome.'),
    email: z.email('Informe um e-mail válido.'),
    password: z.string().min(1, 'Informe uma senha inicial.'),
    addUnit: z.boolean(),
    caveUnitIds: z.array(uuid),
  })
  .superRefine(({ addUnit, caveUnitIds }, context) => {
    if (addUnit && caveUnitIds.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['caveUnitIds'],
        message: 'Selecione ao menos uma unidade.',
      })
    }
  })

type CreateFormValues = z.infer<typeof createFormSchema>

export function TeacherCreateForm() {
  const { selectedContext } = useSession()
  const caveId = selectedContext?.caveId ?? ''
  const unitsQuery = useCaveUnits(caveId)
  const units = unitsQuery.data ?? []
  const mutations = useTeacherMutations()
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      addUnit: false,
      caveUnitIds: [],
    },
  })
  const addUnit = useWatch({ control, name: 'addUnit' })
  const selectedUnitIds = useWatch({ control, name: 'caveUnitIds' })

  async function submit(values: CreateFormValues) {
    const selectedUnits = values.addUnit
      ? units.filter((unit) => values.caveUnitIds.includes(unit.id))
      : []
    const caveName = selectedContext?.label.trim()
    if (values.addUnit && selectedUnits.length === 0) {
      notify.error('Selecione ao menos uma unidade disponível.')
      return
    }
    if (values.addUnit && !caveName) {
      notify.error('Não foi possível identificar a caverna selecionada.')
      return
    }
    try {
      await mutations.create.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        ...(values.addUnit && caveName
          ? {
              caveUnitIds: selectedUnits.map((unit) => ({
                caveUnitId: unit.id,
                caveName,
              })),
            }
          : {}),
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
          Se não selecionar unidades, o professor será associado à caverna
          inteira.
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
      <div className="grid gap-2">
        <label
          className="flex items-center gap-2 text-sm font-medium"
          title="Marcar esta opção vincula o professor somente às unidades selecionadas."
        >
          <input
            type="checkbox"
            disabled={
              !units.length || unitsQuery.isPending || unitsQuery.isError
            }
            {...register('addUnit')}
          />
          Adicionar a unidade
          <Info className="size-4 text-muted-foreground" aria-hidden="true" />
        </label>
        <p className="text-xs text-muted-foreground">
          Ao marcar, o vínculo será específico às unidades escolhidas. Sem
          unidades disponíveis, o professor permanece no escopo da caverna.
        </p>
        {selectedContext?.role === 'academy' &&
          caveId &&
          unitsQuery.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Carregando unidades…
            </p>
          )}
        {selectedContext?.role === 'academy' && unitsQuery.isError && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
            <span>Não foi possível carregar as unidades.</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void unitsQuery.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        )}
        {selectedContext?.role === 'academy' && !caveId && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível identificar a caverna selecionada.
          </p>
        )}
        {selectedContext?.role === 'academy' &&
          !unitsQuery.isPending &&
          !unitsQuery.isError &&
          units.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Esta caverna ainda não tem unidades cadastradas.
            </p>
          )}
        {addUnit && units.length > 0 && (
          <details className="rounded-md border border-input px-3 py-2">
            <summary className="cursor-pointer text-sm">
              Selecionar unidades ({selectedUnitIds.length}{' '}
              {selectedUnitIds.length === 1 ? 'selecionada' : 'selecionadas'})
            </summary>
            <fieldset
              className="mt-3 grid gap-2"
              aria-invalid={Boolean(errors.caveUnitIds)}
            >
              <legend className="sr-only">Unidades da caverna</legend>
              {units.map((unit) => (
                <label
                  key={unit.id}
                  className="flex items-center gap-2 text-sm font-normal"
                >
                  <input
                    type="checkbox"
                    value={unit.id}
                    {...register('caveUnitIds')}
                  />
                  {unit.name}
                </label>
              ))}
            </fieldset>
          </details>
        )}
        {errors.caveUnitIds && (
          <span role="alert" className="text-sm text-destructive">
            {errors.caveUnitIds.message}
          </span>
        )}
      </div>
      <Button
        type="submit"
        disabled={
          isSubmitting ||
          mutations.create.isPending ||
          (selectedContext?.role === 'academy' &&
            (!caveId || unitsQuery.isPending || unitsQuery.isError))
        }
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
  action,
}: {
  teacherId: string
  action: 'link' | 'unlink'
}) {
  const mutations = useTeacherMutations()
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
        UUID da unidade
        <Input
          aria-invalid={Boolean(errors.caveUnitId)}
          {...register('caveUnitId')}
        />
        {errors.caveUnitId && (
          <span className="text-destructive">{errors.caveUnitId.message}</span>
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
