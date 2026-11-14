import { http } from '@/shared/lib/axios'
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
// 401 -> session expired (user must sign in again), except on public auth routes.
// 403 -> handled by the calling screen so it can show a contextual message
// (invalid credentials, missing desktop role or unavailable context).
export function setupAuthInterceptors() {
  const interceptor = http.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status
      if (status === 401 && !isPublicAuthRequest(error.config?.url)) {
        router.navigate(routes.sessionExpired, { replace: true })
      }
      return Promise.reject(error)
    },
  )

  return () => http.interceptors.response.eject(interceptor)
}
