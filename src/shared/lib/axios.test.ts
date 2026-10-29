import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { http, normalizeHttpError } from '@/shared/lib/axios'

describe('HTTP boundary', () => {
  it('uses an injected HTTP adapter and forwards AbortSignal', async () => {
    const controller = new AbortController()
    const response = await http.get('/mock-only', {
      signal: controller.signal,
      adapter: async (config) => {
        expect(config.signal).toBe(controller.signal)
        return {
          data: { ok: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }
      },
    })
    expect(response.data).toEqual({ ok: true })
  })

  it('maps server errors to safe user-facing messages', () => {
    const error = new AxiosError(
      'internal SQL connection string',
      'ERR_BAD_RESPONSE',
      { headers: new AxiosHeaders() },
      undefined,
      {
        data: { secret: 'internal details' },
        status: 500,
        statusText: 'Server Error',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    )
    const normalized = normalizeHttpError(error)
    expect(normalized.kind).toBe('server')
    expect(normalized.message).not.toContain('internal')
  })
})
