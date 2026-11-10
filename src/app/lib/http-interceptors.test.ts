import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { http } from '@/shared/lib/axios'
import { router } from '@/app/router'
import { routes } from '@/app/router/routes'
import {
  setAccessToken,
  setManagementContextId,
} from '@/shared/session/access-token'
import { setupAuthInterceptors } from './http-interceptors'

vi.mock('@/app/router', () => ({
  router: { navigate: vi.fn().mockResolvedValue(undefined) },
}))

function rejected(status: number, config: InternalAxiosRequestConfig) {
  return new AxiosError(
    'Sensitive internal detail',
    undefined,
    config,
    undefined,
    { data: {}, status, statusText: 'refused', headers: {}, config },
  )
}
const onUnauthorized = vi.fn(() => {
  setAccessToken(null)
  setManagementContextId(null)
})
const onForbidden = vi.fn(() => setManagementContextId(null))
let dispose: () => void
beforeEach(() => {
  vi.clearAllMocks()
  setAccessToken('current-token')
  setManagementContextId('context-a')
  dispose = setupAuthInterceptors({ onUnauthorized, onForbidden })
})
afterEach(() => {
  dispose()
  setAccessToken(null)
  setManagementContextId(null)
})
const fail = (url: string, status: number) =>
  http
    .get(url, {
      adapter: async (config) => {
        throw rejected(status, config)
      },
    })
    .catch((error) => error)

describe('session-aware auth responses', () => {
  it.each([401, 403])(
    'keeps failed public login local for status %i',
    async (status) => {
      await fail('/auth/login', status)
      expect(onUnauthorized).not.toHaveBeenCalled()
      expect(onForbidden).not.toHaveBeenCalled()
      expect(router.navigate).not.toHaveBeenCalled()
    },
  )
  it('lets selection handle refused or revoked contexts without a global redirect', async () => {
    await fail('/management/contexts', 403)
    await fail('/management/contexts/switch', 403)
    expect(onForbidden).not.toHaveBeenCalled()
    expect(router.navigate).not.toHaveBeenCalled()
  })
  it('clears the current session before sending an authenticated 401 to the expiration page', async () => {
    await fail('/teachers', 401)
    expect(onUnauthorized).toHaveBeenCalledOnce()
    expect(router.navigate).toHaveBeenCalledWith(routes.sessionExpired, {
      replace: true,
    })
  })
  it('invalidates current context for a scoped 403', async () => {
    await fail('/teachers', 403)
    expect(onForbidden).toHaveBeenCalledOnce()
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(router.navigate).toHaveBeenCalledWith(routes.accessDenied, {
      replace: true,
    })
  })
  it.each([401, 403])(
    'ignores a late status %i from another account',
    async (status) => {
      let reject!: () => void
      const pending = http
        .get('/teachers', {
          adapter: (config) =>
            new Promise((_resolve, rejectPromise) => {
              reject = () => rejectPromise(rejected(status, config))
            }),
        })
        .catch((error) => error)
      await vi.waitFor(() => expect(reject).toBeTypeOf('function'))
      setAccessToken('different-account-token')
      setManagementContextId('different-context')
      reject()
      await pending
      expect(onUnauthorized).not.toHaveBeenCalled()
      expect(onForbidden).not.toHaveBeenCalled()
      expect(router.navigate).not.toHaveBeenCalled()
    },
  )
  it('ignores a late 403 from the previous context of the same account', async () => {
    let reject!: () => void
    const pending = http
      .get('/teachers', {
        adapter: (config) =>
          new Promise((_resolve, rejectPromise) => {
            reject = () => rejectPromise(rejected(403, config))
          }),
      })
      .catch((error) => error)
    await vi.waitFor(() => expect(reject).toBeTypeOf('function'))
    setManagementContextId('context-b')
    reject()
    await pending
    expect(onForbidden).not.toHaveBeenCalled()
    expect(router.navigate).not.toHaveBeenCalled()
  })
})
