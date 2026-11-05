export type EvaluationStatus = 'pending' | 'scheduled' | 'approved'

export type Evaluation = {
  id: string
  date: string
  time: string
  teacherId: string
  teacherName: string
  unitName: string
  studentName: string
  belt: string
  status: EvaluationStatus
}

export type EvaluationFilters = { date: string; teacherId: string }

const evaluations: Evaluation[] = [
  {
    id: 'evaluation-1',
    date: '2026-11-05',
    time: '19:00',
    teacherId: 'teacher-rafael',
    teacherName: 'Rafael Souza',
    unitName: 'Vila Mariana',
    studentName: 'Marina Costa',
    belt: 'Branca',
    status: 'scheduled',
  },
  {
    id: 'evaluation-2',
    date: '2026-11-06',
    time: '18:30',
    teacherId: 'teacher-gabriel',
    teacherName: 'Gabriel Godoi',
    unitName: 'Vila Mariana',
    studentName: 'João Lima',
    belt: 'Azul',
    status: 'pending',
  },
]

export const evaluationDemoService = {
  async list(filters: EvaluationFilters, signal?: AbortSignal) {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(resolve, 100)
      signal?.addEventListener('abort', () => {
        window.clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })
    return evaluations.filter((item) =>
      (!filters.date || item.date === filters.date) &&
      (!filters.teacherId || item.teacherId === filters.teacherId),
    )
  },
}
