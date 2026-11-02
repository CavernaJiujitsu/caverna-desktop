import {
  classInputSchema,
  classSchema,
  type AcademyClass,
  type ClassInput,
} from '@/features/classes/schemas/class.schema'

export type ClassFilters = { unitId: string; date: string }

export const classUnits = [
  { id: 'unit-vila-mariana', name: 'Vila Mariana' },
  { id: 'unit-pinheiros', name: 'Pinheiros' },
]

export const classTeachers = [
  { id: 'teacher-rafael', name: 'Rafael Souza' },
  { id: 'teacher-gabriel', name: 'Gabriel Godoi' },
]

export const classMovements = [
  { id: 'movement-armbar', name: 'Armbar da guarda' },
  { id: 'movement-escape', name: 'Fuga da montada' },
  { id: 'movement-takedown', name: 'Queda de uma perna' },
]

let classes: AcademyClass[] = [
  classSchema.parse({
    id: 'class-regular-1', unitId: 'unit-vila-mariana', unitName: 'Vila Mariana',
    teacherId: 'teacher-rafael', teacherName: 'Rafael Souza', date: '2026-11-05',
    startsAt: '19:00', endsAt: '20:30', capacity: 20, type: 'regular',
    eligibleBelts: ['white', 'blue'], movements: [classMovements[0], classMovements[1]],
    enrollments: [
      { id: 'enrollment-1', studentName: 'Marina Costa', belt: 'white', status: 'confirmed', enrolledAt: '2026-11-02T12:00:00Z' },
      { id: 'enrollment-2', studentName: 'João Lima', belt: 'blue', status: 'reserved', enrolledAt: '2026-11-02T13:00:00Z' },
    ],
  }),
  classSchema.parse({
    id: 'class-validation-1', unitId: 'unit-vila-mariana', unitName: 'Vila Mariana',
    teacherId: 'teacher-gabriel', teacherName: 'Gabriel Godoi', date: '2026-11-06',
    startsAt: '18:30', endsAt: '19:30', capacity: 8, type: 'validation',
    eligibleBelts: ['white'], movements: [classMovements[2]], enrollments: [],
  }),
]

function wait(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, 120)
    signal?.addEventListener('abort', () => { window.clearTimeout(timeout); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
}

export const classDemoService = {
  async list(filters: ClassFilters, signal?: AbortSignal) {
    await wait(signal)
    return classes.filter((item) => (!filters.unitId || item.unitId === filters.unitId) && (!filters.date || item.date === filters.date)).map((item) => classSchema.parse(item))
  },
  async create(input: ClassInput) {
    const parsed = classInputSchema.parse(input)
    const unit = classUnits.find((item) => item.id === parsed.unitId)
    const teacher = classTeachers.find((item) => item.id === parsed.teacherId)
    if (!unit || !teacher) throw new Error('Unidade ou professor não encontrado.')
    const item = classSchema.parse({ id: crypto.randomUUID(), ...parsed, unitName: unit.name, teacherName: teacher.name, movements: classMovements.filter((movement) => parsed.movementIds.includes(movement.id)), enrollments: [] })
    classes = [...classes, item]
    return item
  },
  async update(id: string, input: ClassInput) {
    const parsed = classInputSchema.parse(input)
    const current = classes.find((item) => item.id === id)
    if (!current) throw new Error('Aula não encontrada.')
    if (parsed.capacity < current.enrollments.length) throw new Error('A capacidade não pode ser menor que as inscrições atuais.')
    const unit = classUnits.find((item) => item.id === parsed.unitId)
    const teacher = classTeachers.find((item) => item.id === parsed.teacherId)
    if (!unit || !teacher) throw new Error('Unidade ou professor não encontrado.')
    const item = classSchema.parse({ id, ...parsed, unitName: unit.name, teacherName: teacher.name, movements: classMovements.filter((movement) => parsed.movementIds.includes(movement.id)), enrollments: current.enrollments })
    classes = classes.map((entry) => entry.id === id ? item : entry)
    return item
  },
}
