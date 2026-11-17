import { describe, expect, it, vi } from 'vitest'
import { http, sentAccessToken } from './axios'
import { setAccessToken } from '@/shared/session/access-token'

describe('central axios authentication', () => {
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

  it('reads back the token a request was sent with', async () => {
    const adapter = vi.fn().mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })
    setAccessToken('token-enviado')
    await http.get('/protected', { adapter })
    setAccessToken(null)
    await http.get('/public', { adapter })

    expect(sentAccessToken(adapter.mock.calls[0]?.[0])).toBe('token-enviado')
    expect(sentAccessToken(adapter.mock.calls[1]?.[0])).toBeNull()
    expect(sentAccessToken(undefined)).toBeNull()
  })
})
