import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { useCreatePlatformCave } from '@/features/platform/hooks/use-platform-caves'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'
import { AppError } from '@/shared/types/app-error'

function messageForError(error: unknown, fallback: string) {
  return error instanceof AppError ? error.message : fallback
}

const unitSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da unidade.'),
  address: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  latitude: z
    .preprocess((val) => Number(val), z.number().finite('Latitude inválida.'))
    .refine((v) => v >= -90 && v <= 90, 'Latitude entre -90 e 90.'),
  longitude: z
    .preprocess((val) => Number(val), z.number().finite('Longitude inválida.'))
    .refine((v) => v >= -180 && v <= 180, 'Longitude entre -180 e 180.'),
})

const formSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da caverna.'),
  units: z.array(unitSchema).min(1, 'Informe ao menos uma unidade.'),
})

type FormValues = z.infer<typeof formSchema>

export default function PlatformCaveCreatePage() {
  const navigate = useNavigate()
  const createCave = useCreatePlatformCave()
  const [units, setUnits] = useState<z.infer<typeof unitSchema>[]>([
    { name: '', address: '', neighborhood: '', latitude: 0, longitude: 0 },
  ])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      units: [
        { name: '', address: '', neighborhood: '', latitude: 0, longitude: 0 },
      ],
    },
  })

  const addUnit = () => {
    setUnits((prev) => [
      ...prev,
      { name: '', address: '', neighborhood: '', latitude: 0, longitude: 0 },
    ])
  }

  const removeUnit = (index: number) => {
    if (units.length <= 1) return
    setUnits((prev) => prev.filter((_, i) => i !== index))
  }

  async function submit(values: FormValues) {
    try {
      await createCave.mutateAsync({
        name: values.name,
        units: values.units.map((unit) => ({
          name: unit.name,
          address: unit.address || undefined,
          neighborhood: unit.neighborhood || undefined,
          latitude: unit.latitude,
          longitude: unit.longitude,
        })),
      })
      notify.success('Caverna criada com sucesso.')
      reset()
      navigate(routes.platformCaves)
    } catch (error) {
      notify.error(messageForError(error, 'Não foi possível criar a caverna.'))
    }
  }

  return (
    <ManagementShell>
      <PageHeader
        title="Nova caverna"
        description="Cadastre uma caverna e suas unidades iniciais."
      />
      <form
        className="grid gap-4 rounded-xl border border-border bg-card p-5"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <div>
          <h2 className="text-lg font-semibold">Dados da caverna</h2>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Nome
          <Input aria-invalid={Boolean(errors.name)} {...register('name')} />
          {errors.name && (
            <span className="text-xs text-destructive">
              {errors.name.message}
            </span>
          )}
        </label>

        <div>
          <h2 className="text-lg font-semibold">Unidades</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe ao menos uma unidade. A caverna e as unidades são criadas
            juntas.
          </p>
          <div className="mt-3 space-y-3">
            {units.map((_unit, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Unidade {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={units.length <= 1}
                    onClick={() => removeUnit(index)}
                  >
                    {units.length <= 1 ? null : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Nome
                    <Input
                      aria-invalid={Boolean(errors.units?.[index]?.name)}
                      {...register(`units.${index}.name`)}
                    />
                    {errors.units?.[index]?.name && (
                      <span className="text-xs text-destructive">
                        {errors.units[index].name.message}
                      </span>
                    )}
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Endereço
                    <Input {...register(`units.${index}.address`)} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Bairro
                    <Input {...register(`units.${index}.neighborhood`)} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Latitude
                    <Input
                      type="number"
                      step="any"
                      aria-invalid={Boolean(errors.units?.[index]?.latitude)}
                      {...register(`units.${index}.latitude`)}
                    />
                    {errors.units?.[index]?.latitude && (
                      <span className="text-xs text-destructive">
                        {errors.units[index].latitude.message}
                      </span>
                    )}
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Longitude
                    <Input
                      type="number"
                      step="any"
                      aria-invalid={Boolean(errors.units?.[index]?.longitude)}
                      {...register(`units.${index}.longitude`)}
                    />
                    {errors.units?.[index]?.longitude && (
                      <span className="text-xs text-destructive">
                        {errors.units[index].longitude.message}
                      </span>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={addUnit}
            disabled={isSubmitting || createCave.isPending}
          >
            <Plus className="size-4 mr-2" aria-hidden="true" />
            Adicionar unidade
          </Button>
        </div>

        {errors.root && (
          <p role="alert" className="text-xs text-destructive">
            {errors.root.message}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to={routes.platformCaves}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || createCave.isPending || units.length === 0
            }
          >
            {isSubmitting || createCave.isPending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            Criar caverna
          </Button>
        </div>
      </form>
    </ManagementShell>
  )
}
