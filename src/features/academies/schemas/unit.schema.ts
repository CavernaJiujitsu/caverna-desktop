import { z } from 'zod'

const coordinateSchema = z.union([z.number(), z.string()]).nullable().optional()

export const unitSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  latitude: coordinateSchema,
  longitude: coordinateSchema,
  active: z.boolean().optional(),
})

export const managedUnitSchema = unitSchema.extend({ active: z.boolean() })

const coordinateFormSchema = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === 'number' && Number.isNaN(value) ? undefined : value,
    z
      .number({ error: 'Informe uma coordenada válida.' })
      .finite('Informe uma coordenada válida.')
      .min(minimum, `O valor mínimo é ${minimum}.`)
      .max(maximum, `O valor máximo é ${maximum}.`)
      .optional(),
  )

const unitFormBaseSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  address: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  latitude: coordinateFormSchema(-90, 90),
  longitude: coordinateFormSchema(-180, 180),
})

export const createUnitFormSchema = unitFormBaseSchema.superRefine(
  (values, context) => {
    if (values.latitude === undefined)
      context.addIssue({
        code: 'custom',
        message: 'Informe a latitude.',
        path: ['latitude'],
      })
    if (values.longitude === undefined)
      context.addIssue({
        code: 'custom',
        message: 'Informe a longitude.',
        path: ['longitude'],
      })
    if (values.latitude === 0 && values.longitude === 0)
      context.addIssue({
        code: 'custom',
        message: 'Informe a localização real, não 0,0.',
        path: ['latitude'],
      })
  },
)

export const updateUnitFormSchema = unitFormBaseSchema.superRefine(
  (values, context) => {
    if ((values.latitude === undefined) !== (values.longitude === undefined)) {
      context.addIssue({
        code: 'custom',
        message: 'Informe latitude e longitude juntas.',
        path: values.latitude === undefined ? ['latitude'] : ['longitude'],
      })
    }
    if (values.latitude === 0 && values.longitude === 0)
      context.addIssue({
        code: 'custom',
        message: 'Informe a localização real, não 0,0.',
        path: ['latitude'],
      })
  },
)

export type AcademyUnit = z.infer<typeof unitSchema>
export type ManagedUnit = z.infer<typeof managedUnitSchema>
export type UnitCreateInput = {
  name: string
  address?: string
  neighborhood?: string
  latitude: number
  longitude: number
}
export type UnitUpdateInput = Partial<UnitCreateInput> & { active?: boolean }
export type UnitFormValues = z.infer<typeof updateUnitFormSchema>
export type UnitFormInput = z.input<typeof updateUnitFormSchema>
