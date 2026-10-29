import axios, { AxiosError } from 'axios'
import { env } from '@/shared/lib/env'
import { AppError } from '@/shared/types/app-error'

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
  // Credentials and CSRF will be configured after the API auth contract is agreed.
  withCredentials: false,
})

export function normalizeHttpError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (!axios.isAxiosError(error))
    return new AppError('unknown', 'Something went wrong. Please try again.')
  const axiosError = error as AxiosError
  if (axiosError.code === 'ERR_CANCELED')
    return new AppError('cancelled', 'Request cancelled.')
  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT')
    return new AppError('timeout', 'The request timed out. Please try again.')
  if (!axiosError.response)
    return new AppError(
      'network',
      'Connection failed. Check your network and try again.',
    )

  const status = axiosError.response.status
  if (status === 400 || status === 422)
    return new AppError(
      'validation',
      'Please review the submitted information.',
      status,
    )
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
