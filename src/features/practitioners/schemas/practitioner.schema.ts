import { z } from 'zod'

export const practitionerUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
})

export const practitionerSchema = z.object({
  id: z.string().uuid(),
  user: practitionerUserSchema,
  age: z.number().int().min(0).max(120).nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
})

export type Practitioner = z.infer<typeof practitionerSchema>
export type PractitionerUser = z.infer<typeof practitionerUserSchema>

export type PractitionerInput = {
  name: string
  email: string
  password: string
  age?: number
  latitude?: number
  longitude?: number
}

export const practitionerCreateFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome do aluno.'),
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string(),
    age: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => value === '' || !isNaN(Number(value)),
        'Idade deve ser um número.',
      ),
    address: z.string().trim().min(1, 'Informe o endereço.'),
    number: z.string().trim().min(1, 'Informe o número.'),
    complement: z.string().trim().optional(),
    neighborhood: z.string().trim().min(1, 'Informe o bairro.'),
    city: z.string().trim().min(1, 'Informe a cidade.'),
    latitude: z.string().trim().optional(),
    longitude: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type PractitionerCreateFormValues = z.infer<
  typeof practitionerCreateFormSchema
>

// TODO: confirmar contrato de persistência de endereço com o backend.
// Por enquanto, o endereço é obrigatório no formulário, mas não é enviado ao
// serviço de criação (contrato ainda não conhecido).

export type PractitionerUpdateInput = {
  name?: string
  email?: string
  age?: number
  latitude?: number
  longitude?: number
}
