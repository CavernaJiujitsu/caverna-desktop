import { beforeEach, expect, it, vi } from 'vitest'
import { http } from '@/shared/lib/axios'
import {
  approveEvaluation,
  getLocalDateInputValue,
  listEvaluations,
  rejectEvaluation,
  scheduleEvaluation,
} from '@/features/evaluations/services/evaluation.service'

vi.mock('@/shared/lib/axios', () => ({
  http: { get: vi.fn(), patch: vi.fn() },
  normalizeHttpError: (error: unknown) => error,
}))

const evaluation = { id: 'e1', status: 'SCHEDULED', scheduledAt: null }

// One item of GET /belt-validations?caveId=…&status=PENDING, copied from the
// local API (cave admin seed account, 17/11).
const apiPendingValidation = {
  id: 'ab3d10c0-92df-40c7-80ea-f3f445703207',
  createdAt: '2026-11-17T03:36:50.840Z',
  updatedAt: '2026-11-17T03:36:50.840Z',
  createdBy: null,
  approvedByUserId: null,
  rejectedByUserId: null,
  certificateUrl: null,
  certificateId: null,
  status: 'PENDING',
  scheduledAt: null,
  validatedAt: null,
  notes: null,
  practitioner: {
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
      photoKey: null,
    },
  },
  currentBelt: null,
  targetBelt: {
    id: '63bfbdc9-461a-47fd-aae0-3bb1cb830fd4',
    createdAt: '2026-11-17T03:36:50.589Z',
    updatedAt: '2026-11-17T03:36:50.589Z',
    createdBy: null,
    name: 'Branca',
    color: 'WHITE',
    level: 1,
    minimumTrainingMinutes: 0,
  },
  teacher: null,
  approvedByTeacher: null,
  class: null,
  classId: null,
  approvedByTeacherId: null,
}

function apiValidationPage(
  items: unknown[],
  meta: { page: number; totalPage: number; total: number },
) {
  const href = (page: number) =>
    `/api/v1/belt-validations?page=${page}&limit=20`
  return {
    message: 'Validações de faixa listadas',
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
    timestamp: '2026-11-17T09:56:52.293Z',
  }
}

beforeEach(() => vi.clearAllMocks())

it('requests the given page with only filled filters and maps _meta', async () => {
  vi.mocked(http.get).mockResolvedValueOnce({
    data: apiValidationPage([apiPendingValidation], {
      page: 2,
      totalPage: 3,
      total: 41,
    }),
  })

  const page = await listEvaluations({
    caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
    teacherId: undefined,
    date: '',
    status: 'PENDING',
    page: 2,
  })

  expect(http.get).toHaveBeenCalledWith('/belt-validations', {
    params: {
      caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
      status: 'PENDING',
      page: 2,
      limit: 20,
    },
    signal: undefined,
  })
  expect(page).toMatchObject({ page: 2, totalPages: 3, total: 41 })
  expect(page.items[0]).toMatchObject({
    id: 'ab3d10c0-92df-40c7-80ea-f3f445703207',
    status: 'PENDING',
    practitioner: { user: { name: 'Aluno Demo' } },
    targetBelt: { name: 'Branca' },
    class: null,
  })
})

it('starts at the first page and accepts an empty queue', async () => {
  vi.mocked(http.get).mockResolvedValueOnce({
    data: apiValidationPage([], { page: 1, totalPage: 0, total: 0 }),
  })

  await expect(listEvaluations({ status: 'APPROVED' })).resolves.toEqual({
    items: [],
    page: 1,
    totalPages: 0,
    total: 0,
  })
  expect(vi.mocked(http.get).mock.calls[0]?.[1]?.params).toEqual({
    status: 'APPROVED',
    page: 1,
    limit: 20,
  })
})

it('keeps only the teacher name from validation answers (DEC-backend-2)', async () => {
  // The seed has no scheduled validation, so `class` and `teacher` follow the
  // real User serialization seen in `practitioner.user` above, applied to the
  // seed teacher (DEC-backend-2: the API sends the full teacher user).
  const teacherUser = {
    id: '775476a9-3ac0-4bd2-a9fa-64dbff280e1c',
    createdAt: '2026-11-17T03:36:50.819Z',
    updatedAt: '2026-11-17T03:36:50.819Z',
    createdBy: null,
    name: 'Mestre Semente',
    email: 'mestre.semente@caverna.com',
    role: 'TEACHER',
    photoKey: null,
  }
  const teacher = {
    id: 'e38cab78-a65e-424e-9319-f4db38155202',
    createdAt: '2026-11-17T03:36:50.819Z',
    updatedAt: '2026-11-17T03:36:50.819Z',
    createdBy: null,
    user: teacherUser,
  }
  const scheduled = {
    ...apiPendingValidation,
    status: 'SCHEDULED',
    teacher,
    approvedByTeacher: teacher,
    class: {
      id: '1551ef33-ed29-4841-ac0e-db11d8e0422e',
      type: 'SCHEDULED',
      startsAt: '2026-11-20T22:00:00.000Z',
      caveUnit: {
        id: '7ad902c2-4988-47fc-8340-e7bc2dc3b477',
        name: 'Consolação',
      },
      teacher,
    },
  }
  vi.mocked(http.get).mockResolvedValueOnce({
    data: apiValidationPage([scheduled], { page: 1, totalPage: 1, total: 1 }),
  })
  vi.mocked(http.patch).mockResolvedValueOnce({
    data: { message: 'Validação aprovada', data: scheduled },
  })

  const listed = (await listEvaluations({ status: 'SCHEDULED' })).items[0]
  const approved = await approveEvaluation(scheduled.id)

  for (const evaluation of [listed, approved]) {
    expect(evaluation?.teacher?.user).toEqual({ name: 'Mestre Semente' })
    expect(evaluation?.class?.teacher?.user).toEqual({ name: 'Mestre Semente' })
    expect(JSON.stringify(evaluation)).not.toContain(
      'mestre.semente@caverna.com',
    )
  }
})

it('schedules, approves and rejects through the real routes', async () => {
  vi.mocked(http.patch).mockResolvedValue({ data: { data: evaluation } })

  await scheduleEvaluation('e1', 'class-1')
  await approveEvaluation('e1', { approvedBeltId: 'belt-2' })
  await rejectEvaluation('e1', { suggestedBeltId: 'belt-1', notes: 'Treinar' })

  expect(http.patch).toHaveBeenCalledWith('/belt-validations/e1/schedule', {
    classId: 'class-1',
  })
  expect(http.patch).toHaveBeenCalledWith('/belt-validations/e1/approve', {
    approvedBeltId: 'belt-2',
  })
  expect(http.patch).toHaveBeenCalledWith('/belt-validations/e1/reject', {
    suggestedBeltId: 'belt-1',
    notes: 'Treinar',
  })
})

it('derives a local date input without a fixed calendar date', () => {
  expect(getLocalDateInputValue(new Date(2026, 10, 5))).toBe('2026-11-05')
})
