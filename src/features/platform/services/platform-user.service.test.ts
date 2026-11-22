import { describe, expect, it, vi, beforeEach } from 'vitest'
import { platformUserService } from '@/features/platform/services/platform-user.service'
import { http } from '@/shared/lib/axios'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  normalizeHttpError: vi.fn((error: unknown) => error),
}))

const mockedGet = vi.mocked(http.get)
const mockedDelete = vi.mocked(http.delete)
const mockedPost = vi.mocked(http.post)

const accessView = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Ana',
  email: 'ana@caverna.app',
  primaryRole: 'TEACHER',
  roles: ['TEACHER', 'CAVE_ADMIN'],
  isRoot: false,
  practitionerId: null,
  caveAdmin: {
    id: '660e8400-e29b-41d4-a716-446655440000',
    caveId: '770e8400-e29b-41d4-a716-446655440000',
    caveName: 'Caverna Centro',
  },
  teacher: null,
}

const userId = '550e8400-e29b-41d4-a716-446655440000'

describe('platformUserService', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedDelete.mockReset()
    mockedPost.mockReset()
  })

  it('parses the paginated envelope and forwards the search and role query', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        message: 'Usuários listados',
        data: {
          data: [
            {
              id: userId,
              name: 'Ana',
              email: 'ana@caverna.app',
              role: 'TEACHER',
            },
          ],
          _meta: { page: 2, totalPage: 3, total: 21 },
          _links: {},
        },
      },
    })

    const page = await platformUserService.list({
      page: 2,
      limit: 10,
      search: 'ana',
      role: 'TEACHER',
    })

    expect(mockedGet).toHaveBeenCalledWith('/platform/users', {
      params: { page: 2, limit: 10, search: 'ana', role: 'TEACHER' },
      signal: undefined,
    })
    expect(page).toMatchObject({ page: 2, totalPage: 3, total: 21 })
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.email).toBe('ana@caverna.app')
    // Older API responses without `roles` fall back to the primary role.
    expect(page.items[0]?.roles).toEqual(['TEACHER'])
  })

  it('loads every page for the all-users mode', async () => {
    mockedGet
      .mockResolvedValueOnce({
        data: {
          data: {
            data: [
              {
                id: userId,
                name: 'Ana',
                email: 'ana@caverna.app',
                role: 'STUDENT',
              },
            ],
            _meta: { page: 1, totalPage: 2, total: 2 },
            _links: {},
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            data: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Bia',
                email: 'bia@caverna.app',
                role: 'STUDENT',
              },
            ],
            _meta: { page: 2, totalPage: 2, total: 2 },
            _links: {},
          },
        },
      })

    const page = await platformUserService.listAll({ role: 'STUDENT' })

    expect(mockedGet).toHaveBeenNthCalledWith(1, '/platform/users', {
      params: { page: 1, limit: 100, role: 'STUDENT' },
      signal: undefined,
    })
    expect(mockedGet).toHaveBeenNthCalledWith(2, '/platform/users', {
      params: { page: 2, limit: 100, role: 'STUDENT' },
      signal: undefined,
    })
    expect(page.items.map((item) => item.name)).toEqual(['Ana', 'Bia'])
    expect(page).toMatchObject({ page: 1, totalPage: 2, total: 2 })
  })

  it('finds one user by id', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          id: userId,
          name: 'Ana',
          email: 'ana@caverna.app',
          role: 'ADMIN',
        },
      },
    })

    await expect(platformUserService.findOne(userId)).resolves.toMatchObject({
      id: userId,
      role: 'ADMIN',
    })
    expect(mockedGet).toHaveBeenCalledWith(`/platform/users/${userId}`, {
      signal: undefined,
    })
  })

  it('removes a user through DELETE', async () => {
    mockedDelete.mockResolvedValueOnce({ data: { data: null } })

    await expect(platformUserService.remove(userId)).resolves.toBeUndefined()
    expect(mockedDelete).toHaveBeenCalledWith(`/platform/users/${userId}`)
  })

  it('reads the access view of a user', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: accessView } })

    await expect(platformUserService.getAccess(userId)).resolves.toMatchObject({
      caveAdmin: { caveName: 'Caverna Centro' },
    })
    expect(mockedGet).toHaveBeenCalledWith(`/platform/users/${userId}/access`, {
      signal: undefined,
    })
  })

  it('grants and revokes access through the access endpoints', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: accessView } })
    mockedDelete.mockResolvedValueOnce({ data: { data: accessView } })

    await platformUserService.grantAccess(userId, {
      role: 'TEACHER',
      caveUnitIds: ['880e8400-e29b-41d4-a716-446655440000'],
    })
    await platformUserService.revokeAccess(userId, 'CAVE_ADMIN')

    expect(mockedPost).toHaveBeenCalledWith(
      `/platform/users/${userId}/access`,
      {
        role: 'TEACHER',
        caveUnitIds: ['880e8400-e29b-41d4-a716-446655440000'],
      },
    )
    expect(mockedDelete).toHaveBeenCalledWith(
      `/platform/users/${userId}/access/CAVE_ADMIN`,
    )
  })

  it('creates a management user with its initial access', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: accessView } })
    const input = {
      name: 'Ana',
      email: 'ana@caverna.app',
      password: 'senha-forte',
      role: 'CAVE_ADMIN' as const,
      caveId: '770e8400-e29b-41d4-a716-446655440000',
    }

    await expect(
      platformUserService.createManagementUser(input),
    ).resolves.toMatchObject({ userId: accessView.userId })
    expect(mockedPost).toHaveBeenCalledWith('/platform/users', input)
  })
})
