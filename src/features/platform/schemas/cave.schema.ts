import { z } from 'zod'

export const platformCaveUnitSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  latitude: z.string().or(z.number()).optional(),
  longitude: z.string().or(z.number()).optional(),
  active: z.boolean().default(true),
})

export const platformCaveSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    active: z.boolean().default(true),
    units: z.array(platformCaveUnitSchema).optional(),
  })
  .passthrough()

export const caveAdminSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  caveId: z.string().uuid(),
})

const optionalTrimmedString = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().optional(),
)

export const createCaveAdminSchema = z
  .object({
    name: optionalTrimmedString,
    email: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z.string().trim().email('Informe um e-mail válido.').optional(),
    ),
    password: z.preprocess(
      (value) =>
        typeof value === 'string' && value === '' ? undefined : value,
      z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').optional(),
    ),
    userId: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z.string().uuid('Informe um UUID válido.').optional(),
    ),
  })
  .superRefine((values, context) => {
    if (values.userId) {
      if (values.name || values.email || values.password) {
        context.addIssue({
          code: 'custom',
          message:
            'Não misture o id de conta existente com dados de nova conta.',
          path: ['userId'],
        })
      }
      return
    }

    if (!values.name) {
      context.addIssue({
        code: 'custom',
        message: 'Informe o nome.',
        path: ['name'],
      })
    }
    if (!values.email) {
      context.addIssue({
        code: 'custom',
        message: 'Informe o e-mail.',
        path: ['email'],
      })
    }
    if (!values.password) {
      context.addIssue({
        code: 'custom',
        message: 'Informe uma senha inicial.',
        path: ['password'],
      })
    }
  })

// --- Nova caverna ---

const caveUnitInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da unidade.'),
  address: optionalTrimmedString,
  neighborhood: optionalTrimmedString,
  latitude: z
    .preprocess(
      (value) =>
        typeof value === 'number' ? value : Number(value),
      z.number().finite('Informe uma latitude válida.'),
    )
    .refine((value) => value >= -90 && value <= 90, {
      message: 'Latitude deve estar entre -90 e 90.',
    }),
  longitude: z
    .preprocess(
      (value) =>
        typeof value === 'number' ? value : Number(value),
      z.number().finite('Informe uma longitude válida.'),
    )
    .refine((value) => value >= -180 && value <= 180, {
      message: 'Longitude deve estar entre -180 e 180.',
    }),
})

export const createPlatformCaveSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da caverna.'),
  units: z.array(caveUnitInputSchema).min(1, 'Informe ao menos uma unidade.'),
})

export type CreatePlatformCaveInput = z.infer<typeof createPlatformCaveSchema>

// --- Atualizar caverna ---

export const updatePlatformCaveSchema = z.object({
  name: optionalTrimmedString,
  active: z.boolean().optional(),
}).refine(
  (values) => values.name !== undefined || values.active !== undefined,
  'Informe ao menos um campo para atualizar.',
)

export type UpdatePlatformCaveInput = z.infer<typeof updatePlatformCaveSchema>

export type PlatformCaveUnit = z.infer<typeof platformCaveUnitSchema>
export type PlatformCave = z.infer<typeof platformCaveSchema>
export type CaveAdmin = z.infer<typeof caveAdminSchema>
export type CaveAdminFormInput = z.input<typeof createCaveAdminSchema>
export type CreateCaveAdminInput = z.infer<typeof createCaveAdminSchema>
