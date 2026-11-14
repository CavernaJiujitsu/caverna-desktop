import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredSession,
  readStoredSession,
  SESSION_STORAGE_KEY,
  writeStoredSession,
} from '@/shared/session/session-storage'
import type { Session } from '@/shared/session/session'

const session: Session = {
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'pessoa@exemplo.com',
    name: 'Pessoa',
  },
  accessToken: 'token-abc',
  expiresAt: Date.now() + 7_200_000,
  roles: ['CAVE_ADMIN'],
  caveId: '660e8400-e29b-41d4-a716-446655440001',
}

const context = {
  id: 'academy:cave-1',
  role: 'academy' as const,
  label: 'Academia A',
  detail: 'Todas as unidades',
}

function writeRaw(value: unknown) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value))
}

describe('session storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('round-trips the session and the selected context', () => {
    writeStoredSession({ session, selectedContext: context })

    expect(readStoredSession()).toEqual({ session, selectedContext: context })
  })

  it('accepts a null selected context', () => {
    writeStoredSession({ session, selectedContext: null })

    expect(readStoredSession()).toEqual({ session, selectedContext: null })
  })

  it('discards and removes an expired session', () => {
    writeStoredSession({
      session: { ...session, expiresAt: Date.now() - 1 },
      selectedContext: context,
    })

    expect(readStoredSession()).toBeNull()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('discards and removes corrupt JSON', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, '{not-json')

    expect(readStoredSession()).toBeNull()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('discards and removes an invalid payload', () => {
    writeRaw({ version: 1, session: { accessToken: '' } })

    expect(readStoredSession()).toBeNull()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('discards and removes an unsupported version', () => {
    writeRaw({ version: 99, session, selectedContext: context })

    expect(readStoredSession()).toBeNull()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('clears the stored payload explicitly', () => {
    writeStoredSession({ session, selectedContext: context })

    clearStoredSession()

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('does not throw when storage reads or writes fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    expect(() =>
      writeStoredSession({ session, selectedContext: context }),
    ).not.toThrow()
    expect(readStoredSession()).toBeNull()
    expect(() => clearStoredSession()).not.toThrow()
  })
})
