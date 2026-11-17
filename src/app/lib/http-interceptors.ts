import { isAxiosError } from 'axios'
import { http, sentAccessToken } from '@/shared/lib/axios'
import { getAccessToken } from '@/shared/session/access-token'
import { router } from '@/app/router'
import { routes } from '@/app/router/routes'

// Public endpoints must render their own 401 (invalid credentials, expired
// recovery token) instead of the global session-expired redirect.
const PUBLIC_AUTH_ENDPOINTS = [
  '/desktop/auth/login',
  '/auth/password-recovery/request',
  '/auth/password-recovery/reset',
]

function isPublicAuthRequest(url?: string): boolean {
  if (!url) return false
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

// Handles global authentication responses coming from the API.
// 401 -> session expired (user must sign in again), except on public auth routes
// and except for late replies to a request sent with another token: after a new
// login (or a logout) that 401 belongs to the previous session and must not end
// the current one. Context switches keep the same JWT, and the API only answers
// 401 for the token itself, so a 401 is never context-scoped.
// 403 -> handled by the calling screen so it can show a contextual message
// (invalid credentials, missing desktop role or unavailable context).
export function setupAuthInterceptors() {
  const interceptor = http.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (
        isAxiosError(error) &&
        error.response?.status === 401 &&
        !isPublicAuthRequest(error.config?.url) &&
        sentAccessToken(error.config) === getAccessToken()
      ) {
        void router.navigate(routes.sessionExpired, { replace: true })
      }
      return Promise.reject(error)
    },
  )

  return () => http.interceptors.response.eject(interceptor)
}
