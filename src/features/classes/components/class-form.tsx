import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useBelts } from '@/features/belts/hooks/use-belts'
import { useClassMutations } from '@/features/classes/hooks/use-classes'
import type { ClassScope } from '@/features/classes/hooks/use-class-scope'
import {
  CLASS_TYPES,
  CLASS_TYPE_LABELS,
  classFormSchema,
  type ClassFormValues,
  type ClassItem,
} from '@/features/classes/schemas/class.schema'
import {
  toDateInputValue,
  toTimeInputValue,
} from '@/features/classes/services/class-dates'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'
import { notify } from '@/shared/lib/notifications'

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50'

function defaultValues(
  value: ClassItem | null,
  scope: ClassScope,
): ClassFormValues {
  if (value)
    return {
      caveUnitId: value.caveUnitId,
      teacherId: value.teacherId,
      type: value.type,
      date: toDateInputValue(new Date(value.startsAt)),
      startTime: toTimeInputValue(value.startsAt),
      endTime: toTimeInputValue(value.endsAt),
      capacity: value.capacity,
      beltIds: value.belts.map((belt) => belt.id),
    }
  return {
    caveUnitId: scope.units.length === 1 ? (scope.units[0]?.id ?? '') : '',
    teacherId: scope.isTeacher ? scope.ownTeacherId : '',
    type: 'SCHEDULED',
    date: toDateInputValue(new Date()),
    startTime: '19:00',
    endTime: '20:30',
    capacity: 20,
    beltIds: [],
  }
}

type ClassFormProps = {
  value: ClassItem | null
  scope: ClassScope
  onClose: () => void
}

export function ClassForm({ value, scope, onClose }: ClassFormProps) {
  const { save } = useClassMutations()
  const belts = useBelts()
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: defaultValues(value, scope),
  })
  const selectedBelts = useWatch({ control, name: 'beltIds' })
  const selectedUnitId = useWatch({ control, name: 'caveUnitId' })
  // Only teachers linked to the chosen unit can teach there.
  const unitTeachers = selectedUnitId
    ? scope.teachers.filter((teacher) =>
        teacher.unitIds.includes(selectedUnitId),
      )
    : scope.teachers

  function toggleBelt(beltId: string, checked: boolean) {
    setValue(
      'beltIds',
      checked
        ? [...selectedBelts, beltId]
        : selectedBelts.filter((id) => id !== beltId),
    )
  }

  async function submit(values: ClassFormValues) {
    try {
      await save.mutateAsync({
        id: value?.id,
        values,
        previousTeacherId: value?.teacherId,
      })
      notify.success(value ? 'Aula atualizada.' : 'Aula criada.')
      onClose()
    } catch (error) {
      notify.error(getErrorMessage(error, 'Não foi possível salvar a aula.'))
    }
  }

  const pending = isSubmitting || save.isPending

  return (
    <section
      className="rounded-xl border border-border bg-card p-6"
      aria-labelledby="class-form-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            {value ? 'Editar aula' : 'Nova aula'}
          </p>
          <h2 id="class-form-title" className="mt-2 text-2xl font-semibold">
            {value ? value.caveUnitName : 'Criar aula'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina unidade, professor, horário, vagas e faixas elegíveis.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <form
        className="mt-6 grid gap-5"
        onSubmit={(event) => void handleSubmit(submit)(event)}
        noValidate
      >
        <div className="grid gap-4 md:grid-cols-2">
          {value ? (
            <div className="grid gap-2 text-sm font-medium">
              Unidade
              <p className="flex h-10 items-center text-muted-foreground">
                {value.caveUnitName} (não pode ser alterada)
              </p>
            </div>
          ) : (
            <label className="grid gap-2 text-sm font-medium">
              Unidade
              <select
                className={selectClassName}
                disabled={scope.unitsPending || scope.unitsError}
                aria-invalid={Boolean(errors.caveUnitId)}
                {...register('caveUnitId')}
              >
                <option value="">
                  {scope.unitsPending
                    ? 'Carregando unidades…'
                    : scope.unitsError
                      ? 'Não foi possível carregar as unidades'
                      : 'Selecione'}
                </option>
                {scope.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {errors.caveUnitId && (
                <span className="text-xs text-destructive">
                  {errors.caveUnitId.message}
                </span>
              )}
            </label>
          )}

          {scope.isTeacher ? (
            <div className="grid gap-2 text-sm font-medium">
              Professor
              <p className="flex h-10 items-center text-muted-foreground">
                Você (professor da sessão)
              </p>
            </div>
          ) : (
            <label className="grid gap-2 text-sm font-medium">
              Professor
              <select
                className={selectClassName}
                disabled={scope.teachersPending || scope.teachersError}
                aria-invalid={Boolean(errors.teacherId)}
                {...register('teacherId')}
              >
                <option value="">
                  {scope.teachersPending
                    ? 'Carregando professores…'
                    : scope.teachersError
                      ? 'Não foi possível carregar os professores'
                      : unitTeachers.length === 0
                      ? 'Nenhum professor nesta unidade'
                      : 'Selecione'}
                </option>
                {unitTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {errors.teacherId && (
                <span className="text-xs text-destructive">
                  {errors.teacherId.message}
                </span>
              )}
            </label>
          )}

          <label className="grid gap-2 text-sm font-medium">
            Data
            <Input
              type="date"
              aria-invalid={Boolean(errors.date)}
              {...register('date')}
            />
            {errors.date && (
              <span className="text-xs text-destructive">
                {errors.date.message}
              </span>
            )}
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Tipo
            <select className={selectClassName} {...register('type')}>
              {CLASS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CLASS_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Início
            <Input
              type="time"
              aria-invalid={Boolean(errors.startTime)}
              {...register('startTime')}
            />
            {errors.startTime && (
              <span className="text-xs text-destructive">
                {errors.startTime.message}
              </span>
            )}
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Fim
            <Input
              type="time"
              aria-invalid={Boolean(errors.endTime)}
              {...register('endTime')}
            />
            {errors.endTime && (
              <span className="text-xs text-destructive">
                {errors.endTime.message}
              </span>
            )}
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Capacidade
            <Input
              type="number"
              min={1}
              aria-invalid={Boolean(errors.capacity)}
              {...register('capacity', { valueAsNumber: true })}
            />
            {errors.capacity && (
              <span className="text-xs text-destructive">
                {errors.capacity.message}
              </span>
            )}
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Faixas elegíveis</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            Sem seleção, a aula fica aberta a todas as faixas.
          </p>
          {belts.isPending ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Carregando faixas…
            </p>
          ) : belts.isError ? (
            <p className="mt-2 text-xs text-destructive">
              Não foi possível carregar as faixas.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {belts.data.map((belt) => (
                <label
                  key={belt.id}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedBelts.includes(belt.id)}
                    onChange={(event) =>
                      toggleBelt(belt.id, event.target.checked)
                    }
                  />
                  {belt.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {value ? 'Salvar alterações' : 'Criar aula'}
          </Button>
        </div>
      </form>
    </section>
  )
}
