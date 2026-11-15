import { zodResolver } from '@hookform/resolvers/zod'
import { Info, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { usePlatformUsers } from '@/features/platform/hooks/use-platform-users'
import type { PlatformUser } from '@/features/platform/schemas/user.schema'

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

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const createFormSchema = z
  .object({
    mode: z.enum(['new', 'existing']),
    name: z.string().trim().min(1, 'Informe o nome.').optional(),
    email: z.email('Informe um e-mail válido.').optional(),
    password: z.string().min(1, 'Informe uma senha inicial.').optional(),
    addUnit: z.boolean(),
    caveUnitIds: z.array(uuid),
    userId: z.string().uuid().optional(),
  })
  .superRefine(
    ({ mode, name, email, password, addUnit, caveUnitIds, userId }, context) => {
      if (mode === 'new') {
        if (!name) {
          context.addIssue({
            code: 'custom',
            path: ['name'],
            message: 'Informe o nome.',
          })
        }
        if (!email) {
          context.addIssue({
            code: 'custom',
            path: ['email'],
            message: 'Informe o e-mail.',
          })
        }
        if (!password) {
          context.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'Informe uma senha inicial.',
          })
        }
        if (addUnit && caveUnitIds.length === 0) {
          context.addIssue({
            code: 'custom',
            path: ['caveUnitIds'],
            message: 'Selecione ao menos uma unidade.',
          })
        }
        return
      }

      if (!userId) {
        context.addIssue({
          code: 'custom',
          path: ['userId'],
          message: 'Selecione um professor.',
        })
      }
      if (addUnit && caveUnitIds.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['caveUnitIds'],
          message: 'Selecione ao menos uma unidade.',
        })
      }
    },
  )

type CreateFormValues = z.infer<typeof createFormSchema>

export function TeacherCreateForm() {
  const { selectedContext } = useSession()
  const caveId = selectedContext?.caveId ?? ''
  const unitsQuery = useCaveUnits(caveId)
  const units = unitsQuery.data ?? []
  const mutations = useTeacherMutations()
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [searchInput, setSearchInput] = useState('')
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)

  const debouncedSearch = useDebounce(searchInput, 300)

  const teachers = usePlatformUsers(
    {
      page: 1,
      limit: 10,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      role: 'TEACHER',
      caveId,
    },
    { enabled: mode === 'existing' && debouncedSearch.length > 0 && Boolean(caveId) }
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      mode: 'new',
      name: '',
      email: '',
      password: '',
      addUnit: false,
      caveUnitIds: [],
      userId: undefined,
    },
  })
  const addUnit = useWatch({ control, name: 'addUnit' })
  const selectedUnitIds = useWatch({ control, name: 'caveUnitIds' })

  async function submit(values: CreateFormValues) {
    if (mode === 'existing') {
      if (!selectedUser) return
      try {
        await mutations.linkExisting.mutateAsync({
          userId: selectedUser.id,
        })
        notify.success('Professor vinculado.')
        reset({
          mode: 'new',
          name: '',
          email: '',
          password: '',
          addUnit: false,
          caveUnitIds: [],
          userId: undefined,
        })
        setSelectedUser(null)
        setSearchInput('')
      } catch (error) {
        notify.error(
          errorMessage(error, 'Não foi possível vincular o professor.'),
        )
      }
      return
    }

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
        name: values.name!,
        email: values.email!,
        password: values.password!,
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

  function changeMode(next: 'new' | 'existing') {
    setMode(next)
    reset({
      mode: next,
      name: '',
      email: '',
      password: '',
      addUnit: false,
      caveUnitIds: [],
      userId: undefined,
    })
    setSelectedUser(null)
    setSearchInput('')
  }

  function selectUser(user: PlatformUser) {
    setSelectedUser(user)
    setValue('userId', user.id)
    setSearchInput('')
  }

  function clearSelection() {
    setSelectedUser(null)
    setValue('userId', undefined)
    setSearchInput('')
  }

  const results = teachers.data?.items ?? []
  const isSearching = teachers.isPending && debouncedSearch.length > 0

  return (
    <form
      className="grid gap-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <div>
        <h2 className="text-lg font-semibold">
          {mode === 'new' ? 'Novo professor' : 'Professor existente'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'new'
            ? 'Se não selecionar unidades, o professor será associado à caverna inteira.'
            : 'Busque um professor já cadastrado na plataforma para vinculá-lo.'}
        </p>
      </div>
      <div role="tablist" aria-label="Tipo de professor">
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'new'}
            aria-controls="new-teacher-panel"
            id="new-teacher-tab"
            className="border-b-2 border-transparent px-3 py-2 text-sm font-medium aria-selected:border-primary aria-selected:text-primary"
            onClick={() => changeMode('new')}
          >
            Novo professor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'existing'}
            aria-controls="existing-teacher-panel"
            id="existing-teacher-tab"
            className="border-b-2 border-transparent px-3 py-2 text-sm font-medium aria-selected:border-primary aria-selected:text-primary"
            onClick={() => changeMode('existing')}
          >
            Professor existente
          </button>
        </div>
      </div>

      {mode === 'new' ? (
        <div
          id="new-teacher-panel"
          role="tabpanel"
          aria-labelledby="new-teacher-tab"
          className="grid gap-4"
        >
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
        </div>
      ) : (
        <div
          id="existing-teacher-panel"
          role="tabpanel"
          aria-labelledby="existing-teacher-tab"
        >
          <label className="grid gap-2 text-sm font-medium">
            Buscar professor por nome ou e-mail
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Ex.: maria@caverna.app"
              aria-invalid={mode === 'existing' && Boolean(errors.userId)}
            />
          </label>

          {selectedUser && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card">
              <div>
                <p className="text-sm font-medium">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedUser.email}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                Remover seleção
              </Button>
            </div>
          )}

          {!selectedUser && debouncedSearch.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-card">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Buscando…
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nenhum professor encontrado
                </div>
              ) : (
                <ul role="listbox" aria-label="Professores encontrados">
                  {results.map((user) => (
                    <li
                      key={user.id}
                      role="option"
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => selectUser(user)}
                    >
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

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
      {errors.root?.message && (
        <p role="alert" className="text-xs text-destructive">
          {errors.root.message}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          isSubmitting ||
          mutations.create.isPending ||
          mutations.linkExisting.isPending ||
          (mode === 'existing' && !selectedUser) ||
          (selectedContext?.role === 'academy' &&
            (!caveId || unitsQuery.isPending || unitsQuery.isError))
        }
      >
        {isSubmitting || mutations.create.isPending || mutations.linkExisting.isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {mode === 'new' ? 'Criar professor' : 'Vincular professor'}
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
          disabled={!caveId || unitsQuery.isPending || unitsQuery.isError || units.length === 0}
          aria-invalid={Boolean(errors.caveUnitId)}
          {...register('caveUnitId')}
        >
          <option value="">{!caveId ? 'Contexto de caverna não selecionado' : unitsQuery.isPending ? 'Carregando unidades…' : 'Selecione uma unidade'}</option>
          {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
        </select>
        {errors.caveUnitId && (
          <span className="text-destructive">{errors.caveUnitId.message}</span>
        )}
        {unitsQuery.isError && <span className="text-destructive">Não foi possível carregar as unidades.</span>}
        {!caveId && <span className="text-destructive">Selecione o contexto da caverna antes de vincular uma unidade.</span>}
        {!unitsQuery.isPending && !unitsQuery.isError && units.length === 0 && <span className="text-muted-foreground">Nenhuma unidade ativa disponível.</span>}
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
