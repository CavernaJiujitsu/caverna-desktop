import { http } from '@/shared/lib/axios'
import { router } from '@/app/router'
import { routes } from '@/app/router/routes'

// Handles global authentication/authorization responses coming from the API.
// 401 -> session expired (user must sign in again).
// 403 -> access denied (no authorized context for the requested resource).
export function setupAuthInterceptors() {
  const interceptor = http.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status
      if (status === 401) {
        router.navigate(routes.sessionExpired, { replace: true })
      } else if (status === 403) {
        router.navigate(routes.accessDenied, { replace: true })
      }
      return Promise.reject(error)
    },
  )

  return () => http.interceptors.response.eject(interceptor)
}
