import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PRACTITIONERS_PAGE_SIZE,
  practitionerService,
} from '@/features/practitioners/services/practitioner.service'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

// Keep the real error normalizer: only the transport is replaced.
vi.mock('@/shared/lib/axios', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/axios')>()),
  http: { get: vi.fn(), post: vi.fn() },
}))

const mockedGet = vi.mocked(http.get)

const CAVE_ID = '9157d890-613d-43b8-960a-b090a7af17e2'
const UNIT_ID = '05683939-5e63-4ba4-90b2-7f29007cc0ae'

// GET /practitioners?page=1&limit=3 as ADMIN, copied from the local API (17/11).
const practitionersResponse = {
  message: 'Praticantes listados',
  data: {
    data: [
      {
        id: '308df5a3-a902-418d-9af2-4ca8dea0a750',
        createdAt: '2026-11-17T03:49:45.054Z',
        updatedAt: '2026-11-17T03:49:49.494Z',
        createdBy: null,
        age: null,
        latitude: '-23.46431197',
        longitude: '-46.70046919',
        user: {
          id: 'e71f46d6-5893-4946-a703-5c8f326d9a51',
          createdAt: '2026-11-17T03:49:45.054Z',
          updatedAt: '2026-11-17T03:49:45.054Z',
          createdBy: null,
          name: 'Gabriel Godoi',
          email: 'gabrielgodoi@gmail.com',
          role: 'STUDENT',
        },
        currentBelt: null,
        units: [],
      },
      {
        id: 'cfbbe9b7-78e3-4c88-aa0c-309de44e9b09',
        createdAt: '2026-11-17T03:44:15.668Z',
        updatedAt: '2026-11-17T03:44:29.649Z',
        createdBy: null,
        age: null,
        latitude: '-23.46428022',
        longitude: '-46.70046221',
        user: {
          id: 'c48c5a1c-75ae-4268-b1ad-1460560ccd90',
          createdAt: '2026-11-17T03:44:15.668Z',
          updatedAt: '2026-11-17T03:44:15.668Z',
          createdBy: null,
          name: 'Xpto da silva',
          email: 'xpto@gmail.com',
          role: 'STUDENT',
        },
        currentBelt: null,
        units: [],
      },
      {
        id: '03ab11c3-5b0e-4d8e-b60d-1cf7887144b0',
        createdAt: '2026-11-17T03:36:50.825Z',
        updatedAt: '2026-11-17T03:36:50.825Z',
        createdBy: null,
        age: null,
        latitude: null,
        longitude: null,
        user: {
          id: 'fd00ffe1-3637-4ecd-92f6-bd4109acb53f',
          createdAt: '2026-11-17T03:36:50.819Z',
          updatedAt: '2026-11-17T09:23:47.897Z',
          createdBy: null,
          name: 'Aluno Demo',
          email: 'aluno.demo@caverna.com',
          role: 'STUDENT',
        },
        currentBelt: null,
        units: [
          {
            id: UNIT_ID,
            name: 'Centro',
            caveId: CAVE_ID,
            caveName: 'Caverna Matriz',
          },
          {
            id: '0705f03d-a079-4ae6-80ea-899e31adc123',
            name: 'Brasilândia',
            caveId: '316ba6d1-0277-4727-a042-411b5adaee15',
            caveName: 'Caverna Brasilândia',
          },
        ],
      },
    ],
    _meta: { page: 1, totalPage: 1, total: 3 },
    _links: {
      self: { href: '/api/v1/practitioners?page=1&limit=3' },
      first: { href: '/api/v1/practitioners?page=1&limit=3' },
      prev: null,
      next: null,
      last: { href: '/api/v1/practitioners?page=1&limit=3' },
    },
  },
  timestamp: '2026-11-17T09:56:09.525Z',
}

const [studentWithoutUnits, , studentWithUnits] =
  practitionersResponse.data.data

// No seeded student has an active belt yet; the shape is `{ id, name }` as
// mapped by PractitionersService.findAll, with the "Azul" row of GET /belts.
const blueBelt = { id: 'f0f27fd3-c3bb-4145-ae45-9c23d55f4c89', name: 'Azul' }

function respondWith(students: unknown[]) {
  mockedGet.mockResolvedValueOnce({
    data: {
      ...practitionersResponse,
      data: { ...practitionersResponse.data, data: students },
    },
  })
}

describe('practitionerService.list', () => {
  beforeEach(() => mockedGet.mockReset())

  it('omits empty and missing filters from the query', async () => {
    mockedGet.mockResolvedValueOnce({ data: practitionersResponse })

    await practitionerService.list({
      page: 1,
      search: '',
      caveId: undefined,
      caveUnitId: '',
    })

    expect(mockedGet).toHaveBeenCalledWith('/practitioners', {
      params: { page: 1, limit: PRACTITIONERS_PAGE_SIZE },
      signal: undefined,
    })
  })

  it('forwards the filled filters and the abort signal', async () => {
    mockedGet.mockResolvedValueOnce({ data: practitionersResponse })
    const controller = new AbortController()

    await practitionerService.list(
      { page: 2, search: 'demo', caveId: CAVE_ID, caveUnitId: UNIT_ID },
      controller.signal,
    )

    expect(mockedGet).toHaveBeenCalledWith('/practitioners', {
      params: {
        page: 2,
        search: 'demo',
        caveId: CAVE_ID,
        caveUnitId: UNIT_ID,
        limit: PRACTITIONERS_PAGE_SIZE,
      },
      signal: controller.signal,
    })
  })

  it('parses the real payload, keeping students without belt and their units', async () => {
    mockedGet.mockResolvedValueOnce({ data: practitionersResponse })

    const page = await practitionerService.list({ page: 1 })

    expect(page).toMatchObject({ page: 1, totalPages: 1, total: 3 })
    expect(page.items).toHaveLength(3)
    expect([page.items[0], page.items[2]]).toEqual([
      {
        id: studentWithoutUnits?.id,
        user: {
          id: 'e71f46d6-5893-4946-a703-5c8f326d9a51',
          name: 'Gabriel Godoi',
          email: 'gabrielgodoi@gmail.com',
        },
        currentBelt: null,
        units: [],
      },
      {
        id: studentWithUnits?.id,
        user: {
          id: 'fd00ffe1-3637-4ecd-92f6-bd4109acb53f',
          name: 'Aluno Demo',
          email: 'aluno.demo@caverna.com',
        },
        currentBelt: null,
        units: studentWithUnits?.units,
      },
    ])
  })

  it('accepts a student with a current belt', async () => {
    respondWith([{ ...studentWithUnits, currentBelt: blueBelt }])

    const page = await practitionerService.list({ page: 1 })

    expect(page.items[0]?.currentBelt).toEqual(blueBelt)
  })

  it('accepts a unit whose cave is not loaded', async () => {
    respondWith([
      {
        ...studentWithUnits,
        units: [{ id: UNIT_ID, name: 'Centro', caveId: null, caveName: null }],
      },
    ])

    const page = await practitionerService.list({ page: 1 })

    expect(page.items[0]?.units).toEqual([
      { id: UNIT_ID, name: 'Centro', caveId: null, caveName: null },
    ])
  })

  it('rejects a list item without belt or units instead of rendering a partial row', async () => {
    const withoutUnits: Record<string, unknown> = { ...studentWithUnits }
    delete withoutUnits.units
    respondWith([withoutUnits])

    await expect(practitionerService.list({ page: 1 })).rejects.toMatchObject({
      kind: 'unknown',
    })

    const withoutBelt: Record<string, unknown> = { ...studentWithUnits }
    delete withoutBelt.currentBelt
    respondWith([withoutBelt])

    await expect(practitionerService.list({ page: 1 })).rejects.toBeInstanceOf(
      AppError,
    )
  })

  it('surfaces the API validation message', async () => {
    // Real 400 for GET /practitioners?caveId= (empty UUID).
    mockedGet.mockRejectedValueOnce(
      new AxiosError(
        'Request failed with status code 400',
        'ERR_BAD_REQUEST',
        { headers: new AxiosHeaders() },
        undefined,
        {
          data: {
            message: 'caveId must be a UUID',
            timestamp: '2026-11-17T09:56:18.056Z',
            path: '/api/v1/practitioners?page=1&caveId=',
          },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      ),
    )

    await expect(practitionerService.list({ page: 1 })).rejects.toMatchObject({
      kind: 'validation',
      message: 'caveId must be a UUID',
    })
  })
})

describe('practitionerService.search', () => {
  beforeEach(() => mockedGet.mockReset())

  it('omits an empty search term', async () => {
    mockedGet.mockResolvedValueOnce({ data: practitionersResponse })

    await practitionerService.search('')

    expect(mockedGet).toHaveBeenCalledWith('/practitioners', {
      params: { page: 1, limit: 10 },
      signal: undefined,
    })
  })

  it('sends the term and returns id and user of each match', async () => {
    mockedGet.mockResolvedValueOnce({ data: practitionersResponse })

    const results = await practitionerService.search('demo')

    expect(mockedGet).toHaveBeenCalledWith('/practitioners', {
      params: { page: 1, limit: 10, search: 'demo' },
      signal: undefined,
    })
    expect(results.map((student) => student.user.name)).toEqual([
      'Gabriel Godoi',
      'Xpto da silva',
      'Aluno Demo',
    ])
  })
})
