import { http, normalizeHttpError } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'
import {
  loginResponseSchema,
  type LoginResponse,
} from '@/features/auth/schemas/auth.schema'

const ENDPOINTS = {
  login: '/desktop/auth/login',
} as const

function toLoginError(error: unknown): AppError {
  const normalized = normalizeHttpError(error)
  if (normalized.kind === 'unauthorized')
    return new AppError('unauthorized', 'E-mail ou senha inválidos.', 401)
  if (normalized.kind === 'forbidden')
    return new AppError(
      'forbidden',
      'Esta conta não possui acesso à gestão desktop.',
      403,
    )
  if (normalized.kind === 'rate-limited')
    return new AppError(
      'rate-limited',
      'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
      429,
    )
  return normalized
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.login, {
        email,
        password,
      })
      return loginResponseSchema.parse(data).data
    } catch (error) {
      throw toLoginError(error)
    }
  },
}
