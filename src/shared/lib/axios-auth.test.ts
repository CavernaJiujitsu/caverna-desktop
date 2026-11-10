import { afterEach, describe, expect, it, vi } from 'vitest'
import { http } from './axios'
import {
  setAccessToken,
  setManagementContextId,
} from '@/shared/session/access-token'

afterEach(() => {
  setAccessToken(null)
  setManagementContextId(null)
})

describe('central axios authentication', () => {
  it('sends current context only on scoped operations and removes stale headers on public login', async () => {
    setAccessToken('current-token')
    setManagementContextId('context-b')
    const adapter = vi.fn().mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })
    await http.get('/teachers', { adapter })
    expect(adapter.mock.calls[0]?.[0].headers.get('X-Management-Context')).toBe(
      'context-b',
    )
    await http.get('/management/contexts', { adapter })
    expect(
      adapter.mock.calls[1]?.[0].headers.get('X-Management-Context'),
    ).toBeUndefined()
    expect(adapter.mock.calls[1]?.[0].headers.get('Authorization')).toBe(
      'Bearer current-token',
    )
    await http.post(
      '/auth/login',
      {},
      {
        adapter,
        headers: {
          Authorization: 'Bearer stale',
          'X-Management-Context': 'stale',
        },
      },
    )
    expect(
      adapter.mock.calls[2]?.[0].headers.get('Authorization'),
    ).toBeUndefined()
    expect(
      adapter.mock.calls[2]?.[0].headers.get('X-Management-Context'),
    ).toBeUndefined()
    setAccessToken(null)
    setManagementContextId(null)
    await http.get('/teachers', {
      adapter,
      headers: {
        Authorization: 'Bearer stale',
        'X-Management-Context': 'stale',
      },
    })
    expect(
      adapter.mock.calls[3]?.[0].headers.get('Authorization'),
    ).toBeUndefined()
    expect(
      adapter.mock.calls[3]?.[0].headers.get('X-Management-Context'),
    ).toBeUndefined()
  })
  it('attaches the SessionProvider access token as a bearer token', async () => {
    setAccessToken('token-123')
    const adapter = vi.fn().mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })
    await http.get('/protected', { adapter })
    expect(adapter).toHaveBeenCalled()
    expect(adapter.mock.calls[0]?.[0].url).toBe('/api/v1/protected')
    expect(adapter.mock.calls[0]?.[0].headers.get('Authorization')).toBe(
      'Bearer token-123',
    )
    setAccessToken(null)
  })

  it('não envia token depois da limpeza da sessão', async () => {
    setAccessToken(null)
    const adapter = vi.fn().mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })
    await http.get('/public', { adapter })
    expect(
      adapter.mock.calls[0]?.[0].headers.get('Authorization'),
    ).toBeUndefined()
    expect(adapter.mock.calls[0]?.[0].url).toBe('/api/v1/public')
  })
})
