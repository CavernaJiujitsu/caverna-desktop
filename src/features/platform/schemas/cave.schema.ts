import { z } from 'zod'

export const platformCaveUnitSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  latitude: z.string().or(z.number()).optional(),
  longitude: z.string().or(z.number()).optional(),
})

export const platformCaveSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
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

export type PlatformCaveUnit = z.infer<typeof platformCaveUnitSchema>
export type PlatformCave = z.infer<typeof platformCaveSchema>
export type CaveAdmin = z.infer<typeof caveAdminSchema>
export type CaveAdminFormInput = z.input<typeof createCaveAdminSchema>
export type CreateCaveAdminInput = z.infer<typeof createCaveAdminSchema>
