import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios'
import { RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupAuthInterceptors } from '@/app/lib/http-interceptors'
import { router } from '@/app/router'
import { http } from '@/shared/lib/axios'
import { getAccessToken, setAccessToken } from '@/shared/session/access-token'
import { useSession, type Session } from '@/shared/session/session'
import { SessionProvider } from '@/shared/session/session-context'
import {
  readStoredSession,
  writeStoredSession,
} from '@/shared/session/session-storage'
import type { ManagementContext } from '@/shared/types/management-context'

// The real router lazy-loads every page; a memory router with the real
// session-expired page keeps the test on the redirect and the session cleanup.
vi.mock('@/app/router', async () => {
  const { createElement } = await import('react')
  const { createMemoryRouter } = await import('react-router-dom')
  const { default: SessionExpiredPage } =
    await import('@/features/auth/pages/session-expired-page')
  return {
    router: createMemoryRouter(
      [
        { path: '/units', element: createElement('p', null, 'Unidades') },
        {
          path: '/session-expired',
          element: createElement(SessionExpiredPage),
        },
      ],
      { initialEntries: ['/units'] },
    ),
  }
})

const ROSTER_URL =
  '/memberships/students/cave-units/05683939-5e63-4ba4-90b2-7f29007cc0ae/practitioners'

function session(accessToken: string): Session {
  return {
    user: {
      id: 'f0e0e0e8-8878-48a7-b35f-0c8ebe4c8695',
      email: 'admin@caverna.com',
      name: 'Admin',
    },
    accessToken,
    expiresAt: Date.now() + 7_200_000,
    roles: ['ADMIN'],
  }
}

const academyContext: ManagementContext = {
  id: 'academy:9157d890-613d-43b8-960a-b090a7af17e2',
  role: 'academy',
  label: 'Caverna Matriz',
  detail: 'Gestão da caverna',
  caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
}

const otherAcademyContext: ManagementContext = {
  id: 'academy:316ba6d1-0277-4727-a042-411b5adaee15',
  role: 'academy',
  label: 'Caverna Brasilândia',
  detail: 'Gestão da caverna',
  caveId: '316ba6d1-0277-4727-a042-411b5adaee15',
}

/** Error body as the API sends it (`{ message, timestamp, path }`). */
function apiError(
  config: InternalAxiosRequestConfig,
  status: number,
  message: string,
) {
  return new AxiosError(message, 'ERR_BAD_REQUEST', config, undefined, {
    data: { message, timestamp: '2026-11-17T10:00:39.472Z', path: config.url },
    status,
    statusText: '',
    headers: {},
    config,
  })
}

/** Adapter that holds the request until the test decides how it fails. */
function heldRequest() {
  let fail: (status: number, message: string) => void = () => {
    throw new Error('Request was not sent yet.')
  }
  const adapter = vi.fn<AxiosAdapter>(
    (config) =>
      new Promise((_resolve, reject) => {
        fail = (status, message) => reject(apiError(config, status, message))
      }),
  )
  return {
    adapter,
    fail: (status: number, message: string) => fail(status, message),
  }
}

function SessionControls() {
  const {
    session: current,
    selectedContext,
    setSession,
    setSelectedContext,
  } = useSession()
  return (
    <section>
      <p>Token: {current?.accessToken ?? 'nenhum'}</p>
      <p>Contexto: {selectedContext?.label ?? 'nenhum'}</p>
      <button type="button" onClick={() => setSession(session('token-novo'))}>
        Novo login
      </button>
      <button
        type="button"
        onClick={() => setSelectedContext(otherAcademyContext)}
      >
        Trocar contexto
      </button>
    </section>
  )
}

function renderApp() {
  return render(
    <SessionProvider>
      <SessionControls />
      <RouterProvider router={router} />
    </SessionProvider>,
  )
}

let ejectInterceptors: () => void

beforeEach(async () => {
  await router.navigate('/units', { replace: true })
  ejectInterceptors = setupAuthInterceptors()
})

afterEach(() => {
  ejectInterceptors()
  setAccessToken(null)
})

describe('global 401 interceptor', () => {
  it('clears the session and opens the session-expired page on a 401 for the current token', async () => {
    writeStoredSession({
      session: session('token-atual'),
      selectedContext: academyContext,
    })
    renderApp()
    const request = heldRequest()

    const response = http.get(ROSTER_URL, { adapter: request.adapter })
    await waitFor(() => expect(request.adapter).toHaveBeenCalled())
    request.fail(401, 'Token de acesso inválido')

    await expect(response).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(await screen.findByText('Sessão expirada')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/session-expired')
    await waitFor(() => expect(getAccessToken()).toBeNull())
    expect(readStoredSession()).toBeNull()
    expect(screen.getByText('Token: nenhum')).toBeInTheDocument()
  })

  it('keeps the new session when a 401 sent with the previous token arrives after a new login', async () => {
    writeStoredSession({
      session: session('token-antigo'),
      selectedContext: academyContext,
    })
    renderApp()
    const request = heldRequest()

    const response = http.get(ROSTER_URL, { adapter: request.adapter })
    await waitFor(() => expect(request.adapter).toHaveBeenCalled())
    await userEvent.click(screen.getByRole('button', { name: 'Novo login' }))
    expect(getAccessToken()).toBe('token-novo')

    request.fail(401, 'Token de acesso inválido')
    await expect(response).rejects.toMatchObject({
      response: { status: 401 },
    })
    await act(async () => {})

    expect(router.state.location.pathname).toBe('/units')
    expect(screen.queryByText('Sessão expirada')).not.toBeInTheDocument()
    expect(screen.getByText('Token: token-novo')).toBeInTheDocument()
    expect(getAccessToken()).toBe('token-novo')
    expect(readStoredSession()?.session.accessToken).toBe('token-novo')
  })

  it('does not bounce a signed-out user to session-expired on a late 401', async () => {
    renderApp()
    // The request left with a token that no longer exists (logout happened).
    setAccessToken('token-antigo')
    const request = heldRequest()
    const response = http.get(ROSTER_URL, { adapter: request.adapter })
    await waitFor(() => expect(request.adapter).toHaveBeenCalled())
    setAccessToken(null)

    request.fail(401, 'Token de acesso inválido')
    await expect(response).rejects.toBeInstanceOf(AxiosError)
    await act(async () => {})

    expect(router.state.location.pathname).toBe('/units')
  })

  it('keeps the newly selected context when a late 403 from the previous context arrives', async () => {
    writeStoredSession({
      session: session('token-atual'),
      selectedContext: academyContext,
    })
    renderApp()
    const request = heldRequest()

    const response = http.get(ROSTER_URL, { adapter: request.adapter })
    await waitFor(() => expect(request.adapter).toHaveBeenCalled())
    await userEvent.click(
      screen.getByRole('button', { name: 'Trocar contexto' }),
    )

    request.fail(403, 'Acesso negado às matrículas desta unidade')
    await expect(response).rejects.toMatchObject({
      response: { status: 403 },
    })
    await act(async () => {})

    expect(router.state.location.pathname).toBe('/units')
    expect(
      screen.getByText('Contexto: Caverna Brasilândia'),
    ).toBeInTheDocument()
    expect(screen.getByText('Token: token-atual')).toBeInTheDocument()
  })

  it('still expires the session on a 401 after a context switch, because the JWT is the same', async () => {
    writeStoredSession({
      session: session('token-atual'),
      selectedContext: academyContext,
    })
    renderApp()
    const request = heldRequest()

    const response = http.get(ROSTER_URL, { adapter: request.adapter })
    await waitFor(() => expect(request.adapter).toHaveBeenCalled())
    await userEvent.click(
      screen.getByRole('button', { name: 'Trocar contexto' }),
    )

    request.fail(401, 'Token de acesso inválido')
    await expect(response).rejects.toBeInstanceOf(AxiosError)

    expect(await screen.findByText('Sessão expirada')).toBeInTheDocument()
    await waitFor(() => expect(getAccessToken()).toBeNull())
  })

  it.each([
    '/desktop/auth/login',
    '/auth/password-recovery/request',
    '/auth/password-recovery/reset',
  ])(
    'leaves the 401 of the public endpoint %s to the screen',
    async (endpoint) => {
      renderApp()
      const request = heldRequest()

      const response = http.post(endpoint, {}, { adapter: request.adapter })
      await waitFor(() => expect(request.adapter).toHaveBeenCalled())
      request.fail(401, 'E-mail ou senha inválidos')
      await expect(response).rejects.toBeInstanceOf(AxiosError)
      await act(async () => {})

      expect(router.state.location.pathname).toBe('/units')
    },
  )
})
