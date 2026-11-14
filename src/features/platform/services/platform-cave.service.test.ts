import { beforeEach, describe, expect, it, vi } from 'vitest'
import { platformCaveService } from '@/features/platform/services/platform-cave.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedGet = vi.mocked(http.get)
const mockedPost = vi.mocked(http.post)
const mockedDelete = vi.mocked(http.delete)

const caveId = '550e8400-e29b-41d4-a716-446655440000'
const adminId = '550e8400-e29b-41d4-a716-446655440001'
const userId = '550e8400-e29b-41d4-a716-446655440002'

const admin = {
  id: adminId,
  userId,
  name: 'Maria Souza',
  email: 'maria@example.com',
  caveId,
}

describe('platformCaveService administrators', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
    mockedDelete.mockReset()
  })

  it('parses the admin list envelope and forwards the query signal', async () => {
    const signal = new AbortController().signal
    mockedGet.mockResolvedValueOnce({ data: { data: [admin] } })

    await expect(
      platformCaveService.listAdmins(caveId, signal),
    ).resolves.toEqual([admin])
    expect(mockedGet).toHaveBeenCalledWith(`/platform/caves/${caveId}/admins`, {
      signal,
    })
  })

  it('posts only the new-account contract and never returns the password', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: admin } })

    await expect(
      platformCaveService.createAdmin(caveId, {
        name: 'Maria Souza',
        email: 'maria@example.com',
        password: 'senha123',
      }),
    ).resolves.toEqual(admin)

    expect(mockedPost).toHaveBeenCalledWith(
      `/platform/caves/${caveId}/admins`,
      {
        name: 'Maria Souza',
        email: 'maria@example.com',
        password: 'senha123',
      },
    )
  })

  it('posts only userId when linking an existing account', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: admin } })

    await platformCaveService.createAdmin(caveId, { userId })

    expect(mockedPost).toHaveBeenCalledWith(
      `/platform/caves/${caveId}/admins`,
      {
        userId,
      },
    )
  })

  it('removes only the cave-admin access relation', async () => {
    mockedDelete.mockResolvedValueOnce({ data: { data: null } })

    await expect(
      platformCaveService.removeAdmin(caveId, adminId),
    ).resolves.toBeUndefined()
    expect(mockedDelete).toHaveBeenCalledWith(
      `/platform/caves/${caveId}/admins/${adminId}`,
    )
  })
})
