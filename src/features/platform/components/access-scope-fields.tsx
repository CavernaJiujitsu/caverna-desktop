import { usePlatformCaves } from '@/features/platform/hooks/use-platform-caves'
import type { ManagementAccessRole } from '@/features/platform/schemas/user.schema'
import { getErrorMessage } from '@/shared/lib/error-message'
import { ROLE_LABELS } from '@/shared/types/user-role'

const accessSelectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm'

export type AccessScopeValues = {
  role: ManagementAccessRole
  caveId: string
  caveUnitIds: string[]
}

type AccessScopeFieldsProps = {
  idPrefix: string
  values: AccessScopeValues
  roleOptions: ManagementAccessRole[]
  errors: { role?: string; caveId?: string; caveUnitIds?: string }
  onChange: (next: AccessScopeValues) => void
}

/**
 * Role + scope selectors shared by "grant access" and "new management user":
 * CAVE_ADMIN picks a cave, TEACHER picks a cave and then its units.
 */
export function AccessScopeFields({
  idPrefix,
  values,
  roleOptions,
  errors,
  onChange,
}: AccessScopeFieldsProps) {
  const needsCave = values.role === 'CAVE_ADMIN' || values.role === 'TEACHER'
  const caves = usePlatformCaves({ enabled: needsCave })
  const selectedCave = caves.data?.find((cave) => cave.id === values.caveId)
  const units = (selectedCave?.units ?? []).filter((unit) => unit.active)

  function toggleUnit(unitId: string, checked: boolean) {
    onChange({
      ...values,
      caveUnitIds: checked
        ? [...values.caveUnitIds, unitId]
        : values.caveUnitIds.filter((id) => id !== unitId),
    })
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        Acesso
        <select
          id={`${idPrefix}-role`}
          className={accessSelectClassName}
          value={values.role}
          aria-invalid={Boolean(errors.role)}
          onChange={(event) =>
            onChange({
              role: event.target.value as ManagementAccessRole,
              caveId: '',
              caveUnitIds: [],
            })
          }
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        {errors.role && (
          <span role="alert" className="text-xs text-destructive">
            {errors.role}
          </span>
        )}
      </label>

      {needsCave && (
        <label className="grid gap-2 text-sm font-medium">
          Caverna
          <select
            id={`${idPrefix}-cave`}
            className={accessSelectClassName}
            value={values.caveId}
            disabled={caves.isPending || caves.isError}
            aria-invalid={Boolean(errors.caveId)}
            onChange={(event) =>
              onChange({
                ...values,
                caveId: event.target.value,
                caveUnitIds: [],
              })
            }
          >
            <option value="">
              {caves.isPending ? 'Carregando cavernas…' : 'Selecione a caverna'}
            </option>
            {(caves.data ?? []).map((cave) => (
              <option key={cave.id} value={cave.id}>
                {cave.name}
              </option>
            ))}
          </select>
          {caves.isError && (
            <span role="alert" className="text-xs text-destructive">
              {getErrorMessage(
                caves.error,
                'Não foi possível carregar as cavernas.',
              )}
            </span>
          )}
          {errors.caveId && (
            <span role="alert" className="text-xs text-destructive">
              {errors.caveId}
            </span>
          )}
        </label>
      )}

      {values.role === 'TEACHER' && values.caveId && (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Unidades</legend>
          {units.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Esta caverna não possui unidades ativas.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {units.map((unit) => (
                <label
                  key={unit.id}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={values.caveUnitIds.includes(unit.id)}
                    onChange={(event) =>
                      toggleUnit(unit.id, event.target.checked)
                    }
                  />
                  {unit.name}
                </label>
              ))}
            </div>
          )}
          {errors.caveUnitIds && (
            <span role="alert" className="text-xs text-destructive">
              {errors.caveUnitIds}
            </span>
          )}
        </fieldset>
      )}
    </div>
  )
}
