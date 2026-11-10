import { AxiosHeaders, isAxiosError } from 'axios'
import { http } from '@/shared/lib/axios'
import {
  getAccessToken,
  getManagementContextId,
} from '@/shared/session/access-token'
import { router } from '@/app/router'
import { routes } from '@/app/router/routes'

export function setupAuthInterceptors(handlers: {
  onUnauthorized: () => void
  onForbidden: () => void
}) {
  const interceptor = http.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (!isAxiosError(error)) return Promise.reject(error)
      const headers = AxiosHeaders.from(error.config?.headers)
      const token = getAccessToken()
      const current =
        token && headers.get('Authorization') === `Bearer ${token}`
      const status = error.response?.status
      if (current && status === 401) {
        handlers.onUnauthorized()
        void router.navigate(routes.sessionExpired, { replace: true })
      } else if (current && status === 403) {
        const controlRequest = /\/management\/contexts(?:\/switch)?$/.test(
          error.config?.url ?? '',
        )
        const sentContext = headers.get('X-Management-Context') ?? null
        if (!controlRequest && sentContext === getManagementContextId()) {
          handlers.onForbidden()
          void router.navigate(routes.accessDenied, { replace: true })
        }
      }
      return Promise.reject(error)
    },
  )
  return () => http.interceptors.response.eject(interceptor)
}
