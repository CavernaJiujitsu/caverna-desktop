import { z } from 'zod'

// Interface-only validation. Password policy belongs to the authentication API.
export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

export type LoginValues = z.infer<typeof loginSchema>
