import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'
import {
  loginResponseSchema,
  type LoginResponse,
} from '@/features/auth/schemas/auth.schema'
import { isAxiosError } from 'axios'

// CONTRACT PENDING #78/#98: confirm these endpoints with the authentication
// integration owner (#78) before connecting to a real backend.
const ENDPOINTS = {
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
} as const

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (isAxiosError(error) && error.response) {
    const { status } = error.response
    if (status === 401)
      return new AppError('unauthorized', 'Please sign in to continue.', status)
    if (status === 403)
      return new AppError(
        'forbidden',
        'You do not have access to this resource.',
        status,
      )
    if (status === 404)
      return new AppError(
        'not-found',
        'The requested resource was not found.',
        status,
      )
    if (status >= 500)
      return new AppError(
        'server',
        'The service is unavailable. Please try again later.',
        status,
      )
    return new AppError(
      'unknown',
      'Something went wrong. Please try again.',
      status,
    )
  }
  return new AppError('unknown', 'Something went wrong. Please try again.')
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data } = await http.post<unknown>(ENDPOINTS.login, {
        email,
        password,
      })
      return loginResponseSchema.parse(data)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async logout(): Promise<void> {
    try {
      await http.post(ENDPOINTS.logout)
    } catch (error) {
      throw toAppError(error)
    }
  },
}
