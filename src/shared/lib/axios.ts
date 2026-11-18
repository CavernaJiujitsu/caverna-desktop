import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { z } from 'zod'
import { env } from '@/shared/lib/env'
import { AppError } from '@/shared/types/app-error'
import { getAccessToken } from '@/shared/session/access-token'

const API_PREFIX = '/api/v1'
const BEARER_PREFIX = 'Bearer '
// The API may answer `message` as a string or as a list of validation messages.
const errorEnvelopeSchema = z.object({
  message: z.union([
    z.string().trim().min(1),
    z
      .array(z.string())
      .min(1)
      .transform((messages) => messages.join(' ')),
  ]),
})

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
  if (accessToken)
    config.headers.set('Authorization', `${BEARER_PREFIX}${accessToken}`)
  return config
})

/**
 * Access token a request was sent with, or null when it carried none. Lets
 * response handlers tell a reply to the current session from a late reply to
 * a previous one.
 */
export function sentAccessToken(
  config: InternalAxiosRequestConfig | undefined,
): string | null {
  const header = config?.headers?.get('Authorization')
  return typeof header === 'string' && header.startsWith(BEARER_PREFIX)
    ? header.slice(BEARER_PREFIX.length)
    : null
}

export function normalizeHttpError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (!axios.isAxiosError(error))
    return new AppError('unknown', 'Algo deu errado. Tente novamente.')
  const axiosError = error as AxiosError
  if (axiosError.code === 'ERR_CANCELED')
    return new AppError('cancelled', 'Requisição cancelada.')
  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT')
    return new AppError(
      'timeout',
      'A requisição demorou demais. Tente novamente.',
    )
  if (!axiosError.response)
    return new AppError(
      'network',
      'Falha de conexão. Verifique sua rede e tente novamente.',
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
      message ?? 'Revise as informações enviadas.',
      status,
    )
  if (status === 401)
    return new AppError(
      'unauthorized',
      message ?? 'Entre novamente para continuar.',
      status,
    )
  // Business-rule denials (e.g. the access ladder) carry a user-facing message.
  if (status === 403)
    return new AppError('forbidden', message ?? 'Sem permissão.', status)
  if (status === 429)
    return new AppError(
      'rate-limited',
      message ?? 'Muitas requisições. Tente novamente mais tarde.',
      status,
    )
  if (status === 404)
    return new AppError(
      'not-found',
      message ?? 'O recurso solicitado não foi encontrado.',
      status,
    )
  if (status >= 500)
    return new AppError(
      'server',
      message ?? 'O serviço está indisponível. Tente novamente mais tarde.',
      status,
    )
  return new AppError(
    'unknown',
    message ?? 'Algo deu errado. Tente novamente.',
    status,
  )
}
