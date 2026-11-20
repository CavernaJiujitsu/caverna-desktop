import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiClassBeforeC1,
  apiClassC1,
  apiClassC1Delivered,
  apiClassPage,
} from '@/features/classes/testing/class-api.fixtures'
import { http } from '@/shared/lib/axios'
import { classService } from './class.service'

vi.mock('@/shared/lib/axios', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  normalizeHttpError: (error: unknown) => error,
}))

const meta = { page: 1, totalPage: 1, total: 1 }

const formValues = {
  caveUnitId: 'unit-1',
  teacherId: 'teacher-1',
  type: 'SCHEDULED' as const,
  date: '2026-11-05',
  startTime: '19:00',
  endTime: '20:00',
  capacity: 20,
  beltIds: ['belt-1', 'belt-2'],
}

describe('classService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the first 100 classes for selectors and omits empty filters', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: apiClassPage([apiClassBeforeC1], meta),
    })

    const items = await classService.list({
      caveUnitId: '',
      teacherId: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
      from: '2026-11-05T03:00:00.000Z',
      to: '2026-11-12T02:59:59.999Z',
    })

    expect(items).toHaveLength(1)
    const params = vi.mocked(http.get).mock.calls[0]?.[1]?.params
    expect(params).toEqual({
      page: 1,
      limit: 100,
      teacherId: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
      from: '2026-11-05T03:00:00.000Z',
      to: '2026-11-12T02:59:59.999Z',
    })
  })

  it('requests one cave page from the server and maps its _meta', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: apiClassPage([apiClassC1], { page: 2, totalPage: 3, total: 41 }),
    })

    const page = await classService.listPage({
      caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
      caveUnitId: undefined,
      teacherId: '',
      type: undefined,
      from: '2026-11-17T03:00:00.000Z',
      to: '2026-11-25T02:59:59.999Z',
      page: 2,
    })

    expect(http.get).toHaveBeenCalledWith('/classes', {
      params: {
        caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
        from: '2026-11-17T03:00:00.000Z',
        to: '2026-11-25T02:59:59.999Z',
        page: 2,
        limit: 20,
      },
      signal: undefined,
    })
    expect(page).toMatchObject({ page: 2, totalPages: 3, total: 41 })
    expect(page.items).toHaveLength(1)
  })

  it('preserves occupied seats for the class table', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: apiClassPage([{ ...apiClassC1, enrolledCount: 8 }], meta),
    })

    const { items } = await classService.listPage({ page: 1 })

    expect(items[0]?.enrolledCount).toBe(8)
  })

  it('reads the teacher name from teacher.user (contract C1)', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: apiClassPage([apiClassC1], meta),
    })

    const { items } = await classService.listPage({ page: 1 })

    expect(items[0]).toEqual({
      id: '6894218a-cbdb-477c-82c7-b4ed6b934430',
      type: 'EXAM',
      startsAt: '2026-11-14T18:00:00.000Z',
      endsAt: '2026-11-14T19:30:00.000Z',
      capacity: 20,
      enrolledCount: 0,
      caveUnitId: '7ad902c2-4988-47fc-8340-e7bc2dc3b477',
      caveUnitName: 'Consolação',
      caveName: 'Caverna Matriz',
      teacherId: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
      teacherName: 'Juliana Gracie',
      belts: [{ id: '3de159e5-1fdd-4ed7-a3e5-806121319268', name: 'Marrom' }],
    })
  })

  it('parses the delivered C1 payload of GET /classes?limit=1', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: apiClassPage([apiClassC1Delivered], {
        page: 1,
        totalPage: 26678,
        total: 26678,
      }),
    })

    const { items, totalPages } = await classService.listPage({ limit: 1 })

    expect(totalPages).toBe(26678)
    expect(items[0]).toMatchObject({
      teacherId: '0822e9db-f3c0-4c06-ad90-99c653e3fbeb',
      teacherName: 'Gustavo Carvalho',
      caveName: 'Caverna Curitiba',
      caveUnitName: 'Santa Felicidade',
    })
  })

  it('keeps the teacher name empty when the API omits teacher.user', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: { data: apiClassBeforeC1 } })

    const item = await classService.findOne(apiClassBeforeC1.id)

    expect(item).toMatchObject({
      teacherId: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
      teacherName: null,
      belts: [],
    })
  })

  it('creates a class sending the selected eligible belts', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: { data: apiClassBeforeC1 } })

    await classService.create(formValues)

    expect(http.post).toHaveBeenCalledWith(
      '/classes',
      expect.objectContaining({
        caveUnitId: 'unit-1',
        teacherId: 'teacher-1',
        type: 'SCHEDULED',
        capacity: 20,
        beltIds: ['belt-1', 'belt-2'],
        startsAt: new Date('2026-11-05T19:00:00').toISOString(),
      }),
    )
  })

  it('updates the class and replaces its belts', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    vi.mocked(http.put).mockResolvedValue({ data: {} })

    await classService.update('c1', formValues, formValues.teacherId)

    expect(http.patch).toHaveBeenCalledWith(
      '/classes/c1',
      expect.not.objectContaining({ beltIds: expect.anything() }),
    )
    // The teacher did not change, so it must not be sent (teachers may not reassign).
    expect(http.patch).toHaveBeenCalledWith(
      '/classes/c1',
      expect.not.objectContaining({ teacherId: expect.anything() }),
    )
    expect(http.put).toHaveBeenCalledWith('/classes/c1/belts', {
      beltIds: ['belt-1', 'belt-2'],
    })
  })

  it('maps enrollments and calls the attendance routes', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        data: {
          data: [
            {
              id: 'e1',
              status: 'CONFIRMED',
              confirmedAt: '2026-11-05T22:05:00.000Z',
              practitioner: {
                id: 'p1',
                user: { name: 'Marina', email: 'marina@caverna.com' },
              },
            },
          ],
          _meta: meta,
        },
      },
    })
    // DEC-backend-2: these answers embed the full teacher user (with e-mail).
    // The service resolves to nothing, so no caller can read or render it.
    const bodyWithTeacherEmail = {
      data: {
        data: {
          id: 'e1',
          class: {
            teacher: {
              id: 'e38cab78-a65e-424e-9319-f4db38155202',
              user: {
                id: '775476a9-3ac0-4bd2-a9fa-64dbff280e1c',
                name: 'Mestre Semente',
                email: 'mestre.semente@caverna.com',
              },
            },
          },
        },
      },
    }
    vi.mocked(http.post).mockResolvedValue(bodyWithTeacherEmail)
    vi.mocked(http.patch).mockResolvedValue(bodyWithTeacherEmail)

    await expect(classService.listEnrollments('c1')).resolves.toEqual([
      {
        id: 'e1',
        status: 'CONFIRMED',
        confirmedAt: '2026-11-05T22:05:00.000Z',
        practitionerId: 'p1',
        studentName: 'Marina',
        studentEmail: 'marina@caverna.com',
      },
    ])

    await expect(classService.enroll('c1', 'p1')).resolves.toBeUndefined()
    await expect(classService.checkIn('c1', 'e1')).resolves.toBeUndefined()
    await expect(
      classService.cancelEnrollment('c1', 'e1'),
    ).resolves.toBeUndefined()
    await expect(
      classService.setParticipation('c1', 'e1', {
        startedAt: 'a',
        endedAt: 'b',
      }),
    ).resolves.toBeUndefined()

    expect(http.post).toHaveBeenCalledWith('/classes/c1/enrollments', {
      practitionerId: 'p1',
    })
    expect(http.post).toHaveBeenCalledWith(
      '/classes/c1/enrollments/e1/check-in',
    )
    expect(http.post).toHaveBeenCalledWith('/classes/c1/enrollments/e1/cancel')
    expect(http.patch).toHaveBeenCalledWith(
      '/classes/c1/enrollments/e1/participation',
      { startedAt: 'a', endedAt: 'b' },
    )
  })
})
