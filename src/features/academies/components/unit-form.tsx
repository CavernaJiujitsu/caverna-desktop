import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { AddressLocator } from '@/shared/components/address-locator'
import {
  createUnitFormSchema,
  updateUnitFormSchema,
  type AcademyUnit,
  type UnitFormInput,
  type UnitFormValues,
} from '@/features/academies/schemas/unit.schema'
import { useUnitManagementMutations } from '@/features/academies/hooks/use-academies'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

function coordinateValue(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value !== 'number' && typeof value !== 'string') return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function messageForError(error: unknown) {
  return error instanceof AppError
    ? error.message
    : 'Não foi possível salvar a unidade.'
}

export function UnitForm({
  caveId,
  unit,
  onDone,
}: {
  caveId: string
  unit?: AcademyUnit
  onDone?: () => void
}) {
  const mutations = useUnitManagementMutations(caveId)
  const schema = unit ? updateUnitFormSchema : createUnitFormSchema
  const form = useForm<UnitFormInput, unknown, UnitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: unit?.name ?? '',
      address: unit?.address ?? '',
      neighborhood: unit?.neighborhood ?? '',
      latitude: coordinateValue(unit?.latitude),
      longitude: coordinateValue(unit?.longitude),
    },
  })
  const locationValues = useWatch({ control: form.control })

  async function submit(values: UnitFormValues) {
    if (!values.address?.trim()) {
      form.setError('address', {
        type: 'validate',
        message: 'Informe o endereço.',
      })
      return
    }
    try {
      if (unit) {
        const originalLatitude = coordinateValue(unit.latitude)
        const originalLongitude = coordinateValue(unit.longitude)
        if (
          originalLatitude !== undefined &&
          originalLongitude !== undefined &&
          values.latitude === undefined &&
          values.longitude === undefined
        ) {
          form.setError('latitude', {
            type: 'validate',
            message: 'Informe latitude e longitude para manter a localização.',
          })
          return
        }
        const input = {
          ...(values.name !== unit.name ? { name: values.name } : {}),
          ...(values.address !== (unit.address ?? '')
            ? { address: values.address ?? '' }
            : {}),
          ...(values.neighborhood !== (unit.neighborhood ?? '')
            ? { neighborhood: values.neighborhood ?? '' }
            : {}),
          ...(values.latitude !== originalLatitude
            ? { latitude: values.latitude }
            : {}),
          ...(values.longitude !== originalLongitude
            ? { longitude: values.longitude }
            : {}),
        }
        if (Object.keys(input).length === 0) {
          notify.info('Nenhuma alteração para salvar.')
          onDone?.()
          return
        }
        await mutations.update.mutateAsync({ unitId: unit.id, input })
        notify.success('Unidade atualizada.')
      } else {
        if (values.latitude === undefined || values.longitude === undefined) {
          form.setError('latitude', {
            type: 'validate',
            message: 'Informe latitude e longitude.',
          })
          return
        }
        await mutations.create.mutateAsync({
          name: values.name,
          ...(values.address ? { address: values.address } : {}),
          ...(values.neighborhood ? { neighborhood: values.neighborhood } : {}),
          latitude: values.latitude,
          longitude: values.longitude,
        })
        notify.success('Unidade criada.')
        form.reset()
      }
      onDone?.()
    } catch (error) {
      notify.error(messageForError(error))
    }
  }

  const isPending = mutations.create.isPending || mutations.update.isPending

  return (
    <form
      className="grid gap-3 rounded-lg border border-border bg-card p-4"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="unit-name">
        Nome
        <Input
          id="unit-name"
          aria-invalid={Boolean(form.formState.errors.name)}
          aria-describedby={
            form.formState.errors.name ? 'unit-name-error' : undefined
          }
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <span id="unit-name-error" role="alert" className="text-destructive">
            {form.formState.errors.name.message}
          </span>
        )}
      </label>
      <AddressLocator
        id="unit"
        value={{
          address: locationValues.address ?? '',
          latitude: coordinateValue(locationValues.latitude),
          longitude: coordinateValue(locationValues.longitude),
        }}
        onChange={(location) => {
          form.setValue('address', location.address, {
            shouldDirty: true,
            shouldValidate: true,
          })
          form.setValue('latitude', location.latitude, {
            shouldDirty: true,
            shouldValidate: true,
          })
          form.setValue('longitude', location.longitude, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }}
      />
      {form.formState.errors.address && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.address.message}
        </p>
      )}
      {form.formState.errors.latitude && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.latitude.message}
        </p>
      )}
      {form.formState.errors.longitude && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.longitude.message}
        </p>
      )}
      <label
        className="grid gap-1.5 text-sm font-medium"
        htmlFor="unit-neighborhood"
      >
        Bairro (opcional; ajuste após escolher o endereço)
        <Input id="unit-neighborhood" {...form.register('neighborhood')} />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Salvando…'
            : unit
              ? 'Salvar alterações'
              : 'Criar unidade'}
        </Button>
        {onDone && (
          <Button
            type="button"
            variant="ghost"
            onClick={onDone}
            disabled={isPending}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
