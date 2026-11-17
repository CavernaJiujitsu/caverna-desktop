import type { APIRequestContext, APIResponse } from '@playwright/test'

/** Real local API used by the desktop app. */
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1'
export const SEED_PASSWORD = 'seed-dev'

type Envelope<T> = { message?: string; data: T }
type ApiPage<T> = {
  data: T[]
  _meta: { page: number; totalPage: number; total: number }
}

export type ClassScope = {
  teacherId: string
  teacherName: string
  unitId: string
  unitName: string
}

export type CreatedPractitioner = {
  id: string
  name: string
  email: string
}

export type FutureSlot = {
  startsAt: string
  endsAt: string
  dateInput: string
  timeLabel: string
}

type Teacher = {
  id: string
  name: string
  caveUnits: {
    id: string
    name: string
    caveId: string | null
    caveName: string | null
  }[]
}

type LoginData = {
  accessToken: string
  roles: string[]
  teacherId?: string
  caveId?: string
}

function suffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

async function json<T>(response: APIResponse): Promise<T> {
  return (await response.json()) as T
}

async function expectOk(response: APIResponse, operation: string) {
  if (!response.ok())
    throw new Error(
      `${operation} falhou (${response.status()}): ${await response.text()}`,
    )
  return response
}

/** Logs in through the desktop endpoint. Correct seed credentials only. */
export async function loginApi(
  request: APIRequestContext,
  email: string,
  password = SEED_PASSWORD,
): Promise<string> {
  const response = await request.post(`${API_URL}/desktop/auth/login`, {
    data: { email, password },
  })
  await expectOk(response, `login de ${email}`)
  return (await json<Envelope<LoginData>>(response)).data.accessToken
}

/** Finds the buildable seed scope: Mestre Semente teaching at Centro. */
export async function discoverClassScope(
  request: APIRequestContext,
  adminToken: string,
): Promise<ClassScope> {
  const response = await request.get(`${API_URL}/teachers?limit=100`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  await expectOk(response, 'listagem de professores')
  const page = (await json<Envelope<ApiPage<Teacher>>>(response)).data
  const teacher =
    page.data.find((item) => item.name === 'Mestre Semente') ?? page.data[0]
  if (!teacher) throw new Error('Nenhum professor no seed local.')
  const unit =
    teacher.caveUnits.find(
      (item) => item.name === 'Centro' && item.caveName === 'Caverna Matriz',
    ) ??
    teacher.caveUnits.find((item) => item.name === 'Centro') ??
    teacher.caveUnits[0]
  if (!unit)
    throw new Error(`Professor ${teacher.name} não tem unidade no seed local.`)
  return {
    teacherId: teacher.id,
    teacherName: teacher.name,
    unitId: unit.id,
    unitName: unit.name,
  }
}

/** Creates a real student with a unique e-mail; never deletes it. */
export async function createPractitioner(
  request: APIRequestContext,
  label: string,
): Promise<CreatedPractitioner> {
  const id = suffix()
  const name = `Aluno E2E ${label} ${id}`
  const email = `e2e.${label}.${id}@example.com`
  const response = await request.post(`${API_URL}/practitioners`, {
    data: {
      user: { name, email, password: 'seed-e2e-123' },
    },
  })
  await expectOk(response, 'criação do praticante')
  const body = await json<Envelope<{ id: string }>>(response)
  return { id: body.data.id, name, email }
}

/** Creates a class in the future; the caller chooses a unique slot. */
export async function createClass(
  request: APIRequestContext,
  adminToken: string,
  scope: ClassScope,
  slot: FutureSlot,
  capacity: number,
): Promise<string> {
  const response = await request.post(`${API_URL}/classes`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      caveUnitId: scope.unitId,
      teacherId: scope.teacherId,
      type: 'SCHEDULED',
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      capacity,
    },
  })
  await expectOk(response, 'criação da aula')
  return (await json<Envelope<{ id: string }>>(response)).data.id
}

/** Enrolls a student; check-in itself is reserved to the class teacher. */
export async function enroll(
  request: APIRequestContext,
  token: string,
  classId: string,
  practitionerId: string,
): Promise<string> {
  const response = await request.post(
    `${API_URL}/classes/${classId}/enrollments`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { practitionerId },
    },
  )
  await expectOk(response, 'inscrição na aula')
  return (await json<Envelope<{ id: string }>>(response)).data.id
}

export async function checkIn(
  request: APIRequestContext,
  teacherToken: string,
  classId: string,
  enrollmentId: string,
): Promise<void> {
  const response = await request.post(
    `${API_URL}/classes/${classId}/enrollments/${enrollmentId}/check-in`,
    { headers: { Authorization: `Bearer ${teacherToken}` } },
  )
  await expectOk(response, 'check-in do aluno')
}

/** Creates a SCHEDULED validation tied to a class taught by the approver. */
export async function createScheduledValidation(
  request: APIRequestContext,
  token: string,
  practitionerId: string,
  classId: string,
): Promise<string> {
  const response = await request.post(`${API_URL}/belt-validations`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { practitionerId, classId },
  })
  await expectOk(response, 'criação da validação de faixa')
  return (await json<Envelope<{ id: string }>>(response)).data.id
}

export async function getValidationStatus(
  request: APIRequestContext,
  token: string,
  validationId: string,
): Promise<string> {
  const response = await request.get(
    `${API_URL}/belt-validations/${validationId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  await expectOk(response, 'consulta da validação de faixa')
  return (await json<Envelope<{ status: string }>>(response)).data.status
}

export async function getEnrollmentStatus(
  request: APIRequestContext,
  token: string,
  classId: string,
  practitionerId: string,
): Promise<string | null> {
  const response = await request.get(
    `${API_URL}/classes/${classId}/enrollments?limit=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  await expectOk(response, 'listagem de inscrições')
  const page = (await json<Envelope<ApiPage<Enrollment>>>(response)).data
  const enrollment = page.data.find(
    (item) => item.practitioner?.id === practitionerId,
  )
  return enrollment?.status ?? null
}

type Enrollment = {
  id: string
  status: string
  practitioner?: { id: string }
}

function dateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Local date input value used by the UI filters. */
export function dateInputAfterDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return dateInput(date)
}

const UNIQUE_MINUTES = [7, 13, 19, 23, 31, 37, 43, 49, 53, 59]

/**
 * A future local slot whose minute never matches a seeded slot (00/15/30).
 * `salt` keeps specs that run in the same minute on different hours/minutes,
 * so a row can be found by its time label without ambiguity.
 */
export function futureSlot(daysAhead: number, salt = 0): FutureSlot {
  const seed = Math.floor(Date.now() / 60_000) + daysAhead * 101 + salt * 17
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  date.setHours(
    10 + (seed % 8),
    UNIQUE_MINUTES[seed % UNIQUE_MINUTES.length],
    0,
    0,
  )
  const end = new Date(date.getTime() + 90 * 60_000)
  return {
    startsAt: date.toISOString(),
    endsAt: end.toISOString(),
    dateInput: dateInput(date),
    timeLabel: `${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes(),
    ).padStart(2, '0')}`,
  }
}

/**
 * Capacity above every seeded class (30), used as a second selector in the UI
 * so a row created by an earlier run cannot be mistaken for this one.
 */
export function uniqueCapacity(salt = 0): number {
  return 100 + ((Date.now() + salt * 37) % 900)
}
