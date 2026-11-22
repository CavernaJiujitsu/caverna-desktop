import { http, normalizeHttpError } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'
import { envelopeSchema } from '@/shared/lib/api-schema'
import { z } from 'zod'

const ENDPOINTS = {
  request: '/auth/password-recovery/request',
  reset: '/auth/password-recovery/reset',
} as const

const messageResponseSchema = envelopeSchema(z.null())

function mapRecoveryError(error: unknown): AppError {
  const normalized = normalizeHttpError(error)
  if (normalized.kind === 'rate-limited')
    return new AppError(
      'rate-limited',
      'Muitas tentativas de recuperação. Tente novamente mais tarde.',
      429,
    )
  if (normalized.kind === 'validation')
    return new AppError('validation', 'Informe um e-mail válido.', 400)
  return normalized
}

export const passwordRecoveryService = {
  async request(email: string): Promise<string> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.request, { email })
      const parsed = messageResponseSchema.parse(data)
      return parsed.message ?? 'Link de recuperação enviado.'
    } catch (error) {
      throw mapRecoveryError(error)
    }
  },

  async reset(token: string, password: string): Promise<void> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.reset, {
        token,
        password,
      })
      messageResponseSchema.parse(data)
    } catch (error) {
      const normalized = normalizeHttpError(error)
      if (normalized.kind === 'unauthorized')
        throw new AppError(
          'unauthorized',
          'Link de recuperação inválido ou expirado.',
          401,
        )
      if (normalized.kind === 'validation')
        throw new AppError(
          'validation',
          'A nova senha não atende aos requisitos.',
          400,
        )
      throw normalized
    }
  },
}
