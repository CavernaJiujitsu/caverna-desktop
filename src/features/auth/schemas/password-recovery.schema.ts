import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Informe um e-mail válido.')

export const passwordRecoveryRequestSchema = z.object({ email })

export const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Use pelo menos 8 caracteres.')
      .max(72, 'Use no máximo 72 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

export type PasswordRecoveryRequestValues = z.infer<
  typeof passwordRecoveryRequestSchema
>
export type PasswordResetValues = z.infer<typeof passwordResetSchema>
