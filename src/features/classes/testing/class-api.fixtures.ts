/**
 * Test-only payloads copied from the local API (`GET /api/v1/classes`, cave
 * admin seed account, 17/11/2026). Keep them verbatim: a fixture with fields
 * the API never sent once hid the missing teacher name.
 */

const caveUnit = {
  id: '7ad902c2-4988-47fc-8340-e7bc2dc3b477',
  createdAt: '2026-11-17T03:47:49.379Z',
  updatedAt: '2026-11-17T03:47:49.379Z',
  createdBy: null,
  name: 'Consolação',
  address: 'Rua da Consolação, 2200',
  neighborhood: 'Consolação',
  latitude: '-23.55497000',
  longitude: '-46.66103000',
  active: true,
  cave: {
    id: '9157d890-613d-43b8-960a-b090a7af17e2',
    createdAt: '2026-11-17T03:36:50.717Z',
    updatedAt: '2026-11-17T03:36:50.717Z',
    createdBy: null,
    name: 'Caverna Matriz',
    active: true,
  },
}

/**
 * Payload before contract C1 (captured 09:56 UTC): the teacher carries only
 * audit fields. Class mutations still answer like this (DEC-backend-1).
 */
export const apiClassBeforeC1 = {
  id: '1551ef33-ed29-4841-ac0e-db11d8e0422e',
  createdAt: '2026-11-17T03:47:49.379Z',
  updatedAt: '2026-11-17T03:47:49.379Z',
  createdBy: null,
  type: 'SCHEDULED',
  startsAt: '2026-11-03T06:00:00.000Z',
  endsAt: '2026-11-03T07:30:00.000Z',
  capacity: 30,
  caveUnit,
  teacher: {
    id: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
    createdAt: '2026-11-17T03:47:49.379Z',
    updatedAt: '2026-11-17T03:47:49.379Z',
    createdBy: null,
  },
  belts: [],
  enrolledCount: 0,
  presentCount: 0,
}

/**
 * Item of `GET /api/v1/classes?limit=1` (admin seed account, 17/11 10:12 UTC),
 * after the backend registered C1 as delivered.
 */
export const apiClassC1Delivered = {
  id: '000823af-3e55-4f79-8f8d-b775f693e8aa',
  createdAt: '2026-11-17T03:47:49.379Z',
  updatedAt: '2026-11-17T03:47:49.379Z',
  createdBy: null,
  type: 'SCHEDULED',
  startsAt: '2026-11-03T06:00:00.000Z',
  endsAt: '2026-11-03T07:30:00.000Z',
  capacity: 30,
  caveUnit: {
    id: '2077379d-a96b-4af4-a668-5e2b754bdca7',
    createdAt: '2026-11-17T03:47:49.379Z',
    updatedAt: '2026-11-17T03:47:49.379Z',
    createdBy: null,
    name: 'Santa Felicidade',
    address: 'Av. Manoel Ribas, 5000',
    neighborhood: 'Santa Felicidade',
    latitude: '-25.39750000',
    longitude: '-49.33050000',
    active: true,
    cave: {
      id: 'c8f35b92-465a-4d7b-9bce-d14a0d059a95',
      createdAt: '2026-11-17T03:47:49.379Z',
      updatedAt: '2026-11-17T03:47:49.379Z',
      createdBy: null,
      name: 'Caverna Curitiba',
      active: true,
    },
  },
  teacher: {
    id: '0822e9db-f3c0-4c06-ad90-99c653e3fbeb',
    user: {
      id: '26907f27-d505-4bfe-a42f-6ac5e2c3d950',
      name: 'Gustavo Carvalho',
    },
  },
  belts: [],
  enrolledCount: 0,
  presentCount: 0,
}

/**
 * Payload with contract C1 and eligible belts (`GET /classes?caveId=…&type=EXAM`,
 * cave admin; same teacher shape re-checked after delivery). One of its three
 * belts is kept.
 */
export const apiClassC1 = {
  id: '6894218a-cbdb-477c-82c7-b4ed6b934430',
  createdAt: '2026-11-17T03:47:49.379Z',
  updatedAt: '2026-11-17T03:47:49.379Z',
  createdBy: null,
  type: 'EXAM',
  startsAt: '2026-11-14T18:00:00.000Z',
  endsAt: '2026-11-14T19:30:00.000Z',
  capacity: 20,
  caveUnit,
  teacher: {
    id: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
    user: {
      id: '873ad65a-2a1c-4506-b98d-909e82a94a68',
      name: 'Juliana Gracie',
    },
  },
  belts: [
    {
      id: '37ee186b-9560-4cf8-bb32-0cc52adbab45',
      createdAt: '2026-11-17T03:47:49.379Z',
      updatedAt: '2026-11-17T03:47:49.379Z',
      createdBy: null,
      belt: {
        id: '3de159e5-1fdd-4ed7-a3e5-806121319268',
        createdAt: '2026-11-17T03:36:50.680Z',
        updatedAt: '2026-11-17T03:36:50.680Z',
        createdBy: null,
        name: 'Marrom',
        color: 'BROWN',
        level: 4,
        minimumTrainingMinutes: 0,
      },
    },
  ],
  enrolledCount: 0,
  presentCount: 0,
}

/** Real paginated envelope of `GET /classes` (`_links` as the API sends). */
export function apiClassPage(
  items: unknown[],
  meta: { page: number; totalPage: number; total: number },
) {
  const href = (page: number) => `/api/v1/classes?page=${page}&limit=20`
  return {
    message: 'Aulas listadas',
    data: {
      data: items,
      _meta: meta,
      _links: {
        self: { href: href(meta.page) },
        first: { href: href(1) },
        prev: meta.page > 1 ? { href: href(meta.page - 1) } : null,
        next: meta.page < meta.totalPage ? { href: href(meta.page + 1) } : null,
        last: { href: href(Math.max(meta.totalPage, 1)) },
      },
    },
    timestamp: '2026-11-17T09:56:24.126Z',
  }
}
