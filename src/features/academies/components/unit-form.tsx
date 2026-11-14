import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
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

function coordinateValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return undefined
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
  const [locationMessage, setLocationMessage] = useState('')
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

  function useCurrentLocation() {
    setLocationMessage('')
    if (!navigator.geolocation) {
      setLocationMessage(
        'Localização indisponível neste navegador. Informe as coordenadas manualmente.',
      )
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        form.setValue('latitude', coords.latitude, {
          shouldDirty: true,
          shouldValidate: true,
        })
        form.setValue('longitude', coords.longitude, {
          shouldDirty: true,
          shouldValidate: true,
        })
        setLocationMessage('Coordenadas atuais preenchidas.')
      },
      (error) => {
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Permita a localização nas configurações do navegador ou informe as coordenadas manualmente.'
            : 'Não foi possível obter sua localização. Informe as coordenadas manualmente.',
        )
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  async function submit(values: UnitFormValues) {
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
      <label
        className="grid gap-1.5 text-sm font-medium"
        htmlFor="unit-address"
      >
        Endereço (opcional)
        <Input id="unit-address" {...form.register('address')} />
      </label>
      <label
        className="grid gap-1.5 text-sm font-medium"
        htmlFor="unit-neighborhood"
      >
        Bairro (opcional)
        <Input id="unit-neighborhood" {...form.register('neighborhood')} />
      </label>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Localização</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
          >
            Usar localização atual
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Permita a localização no navegador ou informe as coordenadas
          manualmente. Endereço não é convertido automaticamente.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label
            className="grid gap-1.5 text-sm font-medium"
            htmlFor="unit-latitude"
          >
            Latitude
            <Input
              id="unit-latitude"
              type="number"
              step="any"
              aria-invalid={Boolean(form.formState.errors.latitude)}
              aria-describedby={
                form.formState.errors.latitude
                  ? 'unit-latitude-error'
                  : undefined
              }
              {...form.register('latitude', { valueAsNumber: true })}
            />
            {form.formState.errors.latitude && (
              <span
                id="unit-latitude-error"
                role="alert"
                className="text-destructive"
              >
                {form.formState.errors.latitude.message}
              </span>
            )}
          </label>
          <label
            className="grid gap-1.5 text-sm font-medium"
            htmlFor="unit-longitude"
          >
            Longitude
            <Input
              id="unit-longitude"
              type="number"
              step="any"
              aria-invalid={Boolean(form.formState.errors.longitude)}
              aria-describedby={
                form.formState.errors.longitude
                  ? 'unit-longitude-error'
                  : undefined
              }
              {...form.register('longitude', { valueAsNumber: true })}
            />
            {form.formState.errors.longitude && (
              <span
                id="unit-longitude-error"
                role="alert"
                className="text-destructive"
              >
                {form.formState.errors.longitude.message}
              </span>
            )}
          </label>
        </div>
        {locationMessage && (
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            {locationMessage}
          </p>
        )}
      </div>
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
