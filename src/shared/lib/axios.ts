import axios, { AxiosError } from 'axios'
import { z } from 'zod'
import { env } from '@/shared/lib/env'
import { AppError } from '@/shared/types/app-error'
import { getAccessToken } from '@/shared/session/access-token'

const API_PREFIX = '/api/v1'
const errorEnvelopeSchema = z.object({ message: z.string().trim().min(1) })

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
  // Credentials and CSRF will be configured after the API auth contract is agreed.
  withCredentials: false,
})

http.interceptors.request.use((config) => {
  if (config.url?.startsWith('/') && !config.url.startsWith(API_PREFIX)) {
    config.url = `${API_PREFIX}${config.url}`
  }
  const accessToken = getAccessToken()
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`)
  return config
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
  const responseMessage = errorEnvelopeSchema.safeParse(
    axiosError.response.data,
  )
  const message = responseMessage.success
    ? responseMessage.data.message
    : undefined
  if (status === 400 || status === 422)
    return new AppError(
      'validation',
      message ?? 'Please review the submitted information.',
      status,
    )
  if (status === 401)
    return new AppError(
      'unauthorized',
      message ?? 'Please sign in to continue.',
      status,
    )
  if (status === 403) return new AppError('forbidden', 'Sem permissão.', status)
  if (status === 429)
    return new AppError(
      'rate-limited',
      message ?? 'Too many requests. Please try again later.',
      status,
    )
  if (status === 404)
    return new AppError(
      'not-found',
      message ?? 'The requested resource was not found.',
      status,
    )
  if (status >= 500)
    return new AppError(
      'server',
      message ?? 'The service is unavailable. Please try again later.',
      status,
    )
  return new AppError(
    'unknown',
    message ?? 'Something went wrong. Please try again.',
    status,
  )
}
