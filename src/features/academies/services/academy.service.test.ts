import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import { academyService } from './academy.service'

vi.mock('@/shared/lib/axios', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  normalizeHttpError: (error: unknown) => error,
}))

const activeUnit = {
  id: 'unit-1',
  name: 'Unidade Centro',
  address: 'Rua A',
  neighborhood: 'Centro',
  latitude: -23.5,
  longitude: -46.6,
  active: true,
}

describe('academyService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('consulta cavernas e percorre todas as páginas retornadas', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          data: {
            data: [{ id: 'c1', name: 'Caverna A' }],
            _meta: { page: 1, totalPage: 2, total: 2 },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            data: [{ id: 'c2', name: 'Caverna B' }],
            _meta: { page: 2, totalPage: 2, total: 2 },
          },
        },
      })

    await expect(academyService.list()).resolves.toEqual([
      { id: 'c1', name: 'Caverna A', units: [] },
      { id: 'c2', name: 'Caverna B', units: [] },
    ])
    expect(http.get).toHaveBeenNthCalledWith(
      1,
      '/caves',
      expect.objectContaining({ params: { page: 1, limit: 100 } }),
    )
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      '/caves',
      expect.objectContaining({ params: { page: 2, limit: 100 } }),
    )
  })

  it('lista as unidades com busca e paginação e preserva o estado', async () => {
    const signal = new AbortController().signal
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        data: {
          data: [activeUnit],
          _meta: { page: 2, totalPage: 4, total: 71 },
          _links: { next: '/caves/c1/units?page=3' },
        },
      },
    })

    await expect(
      academyService.listUnitsPage(
        'c1',
        { page: 2, limit: 20, search: 'centro' },
        signal,
      ),
    ).resolves.toEqual({
      items: [activeUnit],
      page: 2,
      totalPage: 4,
      total: 71,
    })
    expect(http.get).toHaveBeenCalledWith(
      '/caves/c1/units',
      expect.objectContaining({
        params: { page: 2, limit: 20, search: 'centro' },
        signal,
      }),
    )
  })

  it('carrega todas as páginas de unidades para seleção', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          data: {
            data: [activeUnit],
            _meta: { page: 1, totalPage: 2, total: 2 },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            data: [{ ...activeUnit, id: 'unit-2', active: false }],
            _meta: { page: 2, totalPage: 2, total: 2 },
          },
        },
      })

    await expect(academyService.listAllManagedUnits('c1')).resolves.toEqual([
      activeUnit,
      { ...activeUnit, id: 'unit-2', active: false },
    ])
    expect(http.get).toHaveBeenNthCalledWith(
      1,
      '/caves/c1/units',
      expect.objectContaining({ params: { page: 1, limit: 100 } }),
    )
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      '/caves/c1/units',
      expect.objectContaining({ params: { page: 2, limit: 100 } }),
    )
  })

  it('consulta, cria, atualiza parcialmente e arquiva unidade', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: { data: activeUnit } })
    vi.mocked(http.post).mockResolvedValueOnce({ data: { data: activeUnit } })
    vi.mocked(http.patch).mockResolvedValueOnce({ data: { data: activeUnit } })
    vi.mocked(http.delete).mockResolvedValueOnce({ data: null })

    await expect(academyService.getUnit('c1', 'unit-1')).resolves.toEqual(
      activeUnit,
    )
    await expect(
      academyService.createUnit('c1', {
        name: activeUnit.name,
        latitude: activeUnit.latitude,
        longitude: activeUnit.longitude,
      }),
    ).resolves.toEqual(activeUnit)
    await expect(
      academyService.updateUnit('c1', 'unit-1', { name: 'Nova unidade' }),
    ).resolves.toEqual(activeUnit)
    await expect(
      academyService.removeUnit('c1', 'unit-1'),
    ).resolves.toBeUndefined()

    expect(http.post).toHaveBeenCalledWith(
      '/caves/c1/units',
      {
        name: activeUnit.name,
        latitude: activeUnit.latitude,
        longitude: activeUnit.longitude,
      },
      expect.any(Object),
    )
    expect(http.patch).toHaveBeenCalledWith(
      '/caves/c1/units/unit-1',
      { name: 'Nova unidade' },
      expect.any(Object),
    )
    expect(http.delete).toHaveBeenCalledWith(
      '/caves/c1/units/unit-1',
      expect.any(Object),
    )
  })

  it('reativa via PATCH ativo true', async () => {
    vi.mocked(http.patch).mockResolvedValueOnce({
      data: { data: { ...activeUnit, active: true } },
    })

    await academyService.updateUnit('c1', 'unit-1', { active: true })

    expect(http.patch).toHaveBeenCalledWith(
      '/caves/c1/units/unit-1',
      { active: true },
      expect.any(Object),
    )
  })
})
