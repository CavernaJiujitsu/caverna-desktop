import { z } from 'zod'

export const practitionerUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
})

export const practitionerSchema = z.object({
  id: z.string().uuid(),
  user: practitionerUserSchema,
})

export type Practitioner = z.infer<typeof practitionerSchema>

/** GET /practitioners list item: student plus current belt and active units. */
export const practitionerListItemSchema = practitionerSchema.extend({
  currentBelt: z.object({ id: z.string(), name: z.string() }).nullable(),
  units: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      caveId: z.string().nullable(),
      caveName: z.string().nullable(),
    }),
  ),
})

export type PractitionerListItem = z.infer<typeof practitionerListItemSchema>

export type PractitionerListPage = {
  items: PractitionerListItem[]
  page: number
  totalPages: number
  total: number
}

/** Body accepted by POST /practitioners (account + optional coordinates). */
export type PractitionerInput = {
  name: string
  email: string
  password: string
  latitude?: number
  longitude?: number
}

const optionalCoordinate = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        (Number.isFinite(Number(value)) &&
          Number(value) >= min &&
          Number(value) <= max),
      `Informe uma ${label} entre ${min} e ${max}.`,
    )

export const practitionerCreateFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome do aluno.'),
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    confirmPassword: z.string(),
    latitude: optionalCoordinate(-90, 90, 'latitude'),
    longitude: optionalCoordinate(-180, 180, 'longitude'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })
  .refine((data) => (data.latitude === '') === (data.longitude === ''), {
    message: 'Informe latitude e longitude juntas.',
    path: ['longitude'],
  })

export type PractitionerCreateFormValues = z.infer<
  typeof practitionerCreateFormSchema
>
