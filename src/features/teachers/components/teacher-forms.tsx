import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  cavesOf,
  useScopeUnits,
  type ScopeUnit,
} from '@/features/management/hooks/use-scope-units'
import { useTeacherMutations } from '@/features/teachers/hooks/use-teachers'
import type { Teacher } from '@/features/teachers/schemas/teacher.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'
import { useSession } from '@/shared/session/session'

const selectClassName =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function UnitCheckboxList({
  units,
  checked,
  disabled,
  onToggle,
}: {
  units: ScopeUnit[]
  checked: (unitId: string) => boolean
  disabled?: boolean
  onToggle: (unit: ScopeUnit, nextChecked: boolean) => void
}) {
  if (units.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma unidade ativa disponível.
      </p>
    )
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {units.map((unit) => (
        <label
          key={unit.id}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/50"
        >
          <input
            type="checkbox"
            checked={checked(unit.id)}
            disabled={disabled}
            onChange={(event) => onToggle(unit, event.target.checked)}
          />
          {unit.name}
        </label>
      ))}
    </div>
  )
}

const createFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

type CreateFormValues = z.infer<typeof createFormSchema>

/**
 * Creates the teacher account. Units are optional on the platform (pick a
 * cave, then its units); a cave admin must link at least one unit of its cave.
 */
export function TeacherCreateForm() {
  const { selectedContext } = useSession()
  const isPlatform = selectedContext?.role === 'platform'
  const mutations = useTeacherMutations()
  const scope = useScopeUnits()
  const [caveId, setCaveId] = useState('')
  const [unitIds, setUnitIds] = useState<string[]>([])
  const [unitsError, setUnitsError] = useState<string | null>(null)

  const caves = cavesOf(scope.units)
  const visibleUnits = isPlatform
    ? scope.units.filter((unit) => unit.caveId === caveId)
    : scope.units

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  function toggleUnit(unit: ScopeUnit, nextChecked: boolean) {
    setUnitsError(null)
    setUnitIds((current) =>
      nextChecked
        ? [...current, unit.id]
        : current.filter((id) => id !== unit.id),
    )
  }

  async function submit(values: CreateFormValues) {
    if (!isPlatform && unitIds.length === 0) {
      setUnitsError('Selecione ao menos uma unidade da caverna.')
      return
    }
    try {
      await mutations.create.mutateAsync({ ...values, caveUnitIds: unitIds })
      reset()
      setUnitIds([])
      notify.success('Professor criado.')
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível criar o professor.'),
      )
    }
  }

  const pending = isSubmitting || mutations.create.isPending

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      <div>
        <h2 className="text-base font-semibold">Novo professor</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isPlatform
            ? 'As unidades são opcionais e podem ser vinculadas depois.'
            : 'Vincule ao menos uma unidade da sua caverna.'}
        </p>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Nome
        <Input aria-invalid={Boolean(errors.name)} {...register('name')} />
        {errors.name && (
          <span className="text-xs text-destructive">
            {errors.name.message}
          </span>
        )}
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        E-mail
        <Input
          type="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && (
          <span className="text-xs text-destructive">
            {errors.email.message}
          </span>
        )}
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Senha inicial
        <Input
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password && (
          <span className="text-xs text-destructive">
            {errors.password.message}
          </span>
        )}
      </label>
      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">
          Unidades {isPlatform ? '(opcional)' : ''}
        </legend>
        {scope.isPending ? (
          <p className="text-sm text-muted-foreground">Carregando unidades…</p>
        ) : scope.isError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar as unidades.
          </p>
        ) : (
          <>
            {isPlatform && (
              <select
                aria-label="Caverna"
                className={selectClassName}
                value={caveId}
                onChange={(event) => {
                  setCaveId(event.target.value)
                  setUnitIds([])
                }}
              >
                <option value="">Sem unidade por enquanto</option>
                {caves.map((cave) => (
                  <option key={cave.id} value={cave.id}>
                    {cave.name}
                  </option>
                ))}
              </select>
            )}
            {(!isPlatform || caveId) && (
              <UnitCheckboxList
                units={visibleUnits}
                checked={(unitId) => unitIds.includes(unitId)}
                onToggle={toggleUnit}
              />
            )}
          </>
        )}
        {unitsError && (
          <span role="alert" className="text-xs text-destructive">
            {unitsError}
          </span>
        )}
      </fieldset>
      <Button type="submit" className="mt-1" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Criar professor
      </Button>
    </form>
  )
}

const updateFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
})

type UpdateFormValues = z.infer<typeof updateFormSchema>

export function TeacherUpdateForm({ teacher }: { teacher: Teacher }) {
  const mutations = useTeacherMutations()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: { name: teacher.name, email: teacher.email ?? '' },
  })

  async function submit(values: UpdateFormValues) {
    const input: { name?: string; email?: string } = {}
    if (values.name !== teacher.name) input.name = values.name
    if (values.email !== (teacher.email ?? '')) input.email = values.email
    if (Object.keys(input).length === 0) {
      notify.info('Nenhuma alteração para salvar.')
      return
    }
    try {
      await mutations.update.mutateAsync({ teacherId: teacher.id, input })
      notify.success('Professor atualizado.')
    } catch (error) {
      notify.error(
        getErrorMessage(error, 'Não foi possível atualizar o professor.'),
      )
    }
  }

  const pending = isSubmitting || mutations.update.isPending

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
          <span className="text-xs text-destructive">
            {errors.name.message}
          </span>
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
          <span className="text-xs text-destructive">
            {errors.email.message}
          </span>
        )}
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Salvar alterações
      </Button>
    </form>
  )
}
