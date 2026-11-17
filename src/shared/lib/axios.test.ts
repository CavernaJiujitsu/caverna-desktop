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

  it('uses the contracted error message, including business-rule denials', () => {
    const validation = new AxiosError(
      'invalid request',
      'ERR_BAD_REQUEST',
      { headers: new AxiosHeaders() },
      undefined,
      {
        data: { message: 'O e-mail já está em uso.' },
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    )
    const forbidden = new AxiosError(
      'forbidden',
      'ERR_BAD_REQUEST',
      { headers: new AxiosHeaders() },
      undefined,
      {
        data: { message: ['Somente ROOT pode conceder ADMIN.'] },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    )

    expect(normalizeHttpError(validation).message).toBe(
      'O e-mail já está em uso.',
    )
    expect(normalizeHttpError(forbidden).message).toBe(
      'Somente ROOT pode conceder ADMIN.',
    )
  })

  it('falls back to a generic message for a forbidden response without body', () => {
    const forbidden = new AxiosError(
      'forbidden',
      'ERR_BAD_REQUEST',
      { headers: new AxiosHeaders() },
      undefined,
      {
        data: {},
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    )

    expect(normalizeHttpError(forbidden).message).toBe('Sem permissão.')
  })

  it.each([
    [400, 'validation', 'Revise as informações enviadas.'],
    [422, 'validation', 'Revise as informações enviadas.'],
    [401, 'unauthorized', 'Entre novamente para continuar.'],
    [404, 'not-found', 'O recurso solicitado não foi encontrado.'],
    [429, 'rate-limited', 'Muitas requisições. Tente novamente mais tarde.'],
    [500, 'server', 'O serviço está indisponível. Tente novamente mais tarde.'],
    [418, 'unknown', 'Algo deu errado. Tente novamente.'],
  ])(
    'falls back to a Portuguese message for a %i without a contracted body',
    (status, kind, message) => {
      const error = new AxiosError(
        'request failed',
        'ERR_BAD_RESPONSE',
        { headers: new AxiosHeaders() },
        undefined,
        {
          data: '<html>proxy error</html>',
          status,
          statusText: '',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      )
      const normalized = normalizeHttpError(error)
      expect(normalized.kind).toBe(kind)
      expect(normalized.message).toBe(message)
      expect(normalized.status).toBe(status)
    },
  )

  it.each([
    ['ERR_CANCELED', 'cancelled', 'Requisição cancelada.'],
    ['ECONNABORTED', 'timeout', 'A requisição demorou demais. Tente novamente.'],
    ['ETIMEDOUT', 'timeout', 'A requisição demorou demais. Tente novamente.'],
    [
      'ERR_NETWORK',
      'network',
      'Falha de conexão. Verifique sua rede e tente novamente.',
    ],
  ])(
    'falls back to a Portuguese message for %s without a response',
    (code, kind, message) => {
      const normalized = normalizeHttpError(
        new AxiosError('no response', code, { headers: new AxiosHeaders() }),
      )
      expect(normalized.kind).toBe(kind)
      expect(normalized.message).toBe(message)
    },
  )

  it('falls back to a Portuguese message for a non-HTTP failure', () => {
    const normalized = normalizeHttpError(new Error('stack details'))
    expect(normalized.kind).toBe('unknown')
    expect(normalized.message).toBe('Algo deu errado. Tente novamente.')
  })
})
