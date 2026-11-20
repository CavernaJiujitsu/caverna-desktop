import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClassesManagementPage from '@/features/classes/pages/classes-management-page'
import type { ClassItem } from '@/features/classes/schemas/class.schema'
import type { ClassListQuery } from '@/features/classes/services/class.service'

const CAVE_ID = '9157d890-613d-43b8-960a-b090a7af17e2'
const TEACHER_ID = 'e38cab78-a65e-424e-9319-f4db38155202'

const mocks = vi.hoisted(() => ({
  role: 'academy' as 'academy' | 'teacher',
  useClasses: vi.fn(),
  useClass: vi.fn(),
  useScopeUnits: vi.fn(),
  useTeacherOptions: vi.fn(),
  refetchUnits: vi.fn(),
  refetchTeachers: vi.fn(),
  refetchClasses: vi.fn(),
}))

vi.mock('@/shared/session/session', () => ({
  useSession: () => ({
    selectedContext:
      mocks.role === 'academy'
        ? {
            id: `academy:${CAVE_ID}`,
            role: 'academy',
            caveId: CAVE_ID,
            label: 'Caverna Matriz',
            detail: '',
          }
        : { id: 'teacher:1', role: 'teacher', label: 'Professor', detail: '' },
    session: {
      teacherId: mocks.role === 'teacher' ? TEACHER_ID : undefined,
      user: { name: 'Mestre Semente' },
    },
  }),
}))

vi.mock('@/features/management/components/management-shell', () => ({
  ManagementShell: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock('@/features/management/hooks/use-scope-units', () => ({
  useScopeUnits: mocks.useScopeUnits,
}))

vi.mock('@/features/teachers/hooks/use-teachers', () => ({
  useTeacherOptions: mocks.useTeacherOptions,
}))

vi.mock('@/features/classes/hooks/use-classes', () => ({
  useClasses: mocks.useClasses,
  useClass: mocks.useClass,
  useClassMutations: () => ({
    remove: { isPending: false, mutateAsync: vi.fn() },
  }),
}))

vi.mock('@/features/classes/components/class-attendance-panel', () => ({
  ClassAttendancePanel: ({ item }: { item: ClassItem }) => (
    <div>Chamada da unidade {item.caveUnitName}</div>
  ),
}))

function classItem(overrides: Partial<ClassItem> = {}): ClassItem {
  return {
    id: '6894218a-cbdb-477c-82c7-b4ed6b934430',
    type: 'EXAM',
    startsAt: '2026-11-14T18:00:00.000Z',
    endsAt: '2026-11-14T19:30:00.000Z',
    capacity: 20,
    caveUnitId: '7ad902c2-4988-47fc-8340-e7bc2dc3b477',
    caveUnitName: 'Consolação',
    caveName: 'Caverna Matriz',
    teacherId: 'af4afb49-4e49-4373-89c7-dad1d8c55277',
    teacherName: 'Juliana Gracie',
    belts: [],
    ...overrides,
  }
}

function classPage(items: ClassItem[], page = 1, totalPages = 1, total = 1) {
  return {
    isPending: false,
    isError: false,
    isPlaceholderData: false,
    data: { items, page, totalPages, total },
    refetch: mocks.refetchClasses,
  }
}

/** Query sent to the API by the latest render. */
function lastQuery(): ClassListQuery {
  return mocks.useClasses.mock.lastCall?.[0] as ClassListQuery
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/classes']}>
      <ClassesManagementPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.role = 'academy'
  mocks.useScopeUnits.mockReturnValue({
    units: [{ id: 'unit-centro', name: 'Centro', caveId: CAVE_ID }],
    isPending: false,
    isError: false,
    refetch: mocks.refetchUnits,
  })
  mocks.useTeacherOptions.mockReturnValue({
    data: [{ id: 'teacher-9', name: 'Rafael Souza', caveUnits: [] }],
    isPending: false,
    isError: false,
    refetch: mocks.refetchTeachers,
  })
  mocks.useClasses.mockReturnValue(classPage([classItem()]))
  mocks.useClass.mockReturnValue({ isPending: true })
})

describe('ClassesManagementPage', () => {
  it('asks the API for one page of the academy cave instead of filtering locally', () => {
    // The class unit is not among the loaded scope units: the server already
    // scoped the list by cave, so the page must not drop it.
    mocks.useClasses.mockReturnValue(
      classPage([classItem({ caveUnitId: 'unit-outra' })], 1, 3, 41),
    )
    renderPage()

    expect(lastQuery()).toMatchObject({ caveId: CAVE_ID, page: 1 })
    expect(lastQuery().caveUnitId).toBeUndefined()
    expect(lastQuery().teacherId).toBeUndefined()
    expect(lastQuery()).not.toHaveProperty('limit')
    expect(
      within(screen.getByRole('table', { name: 'Aulas' })).getAllByRole('row'),
    ).toHaveLength(2)
    expect(screen.getByText('41 aula(s)')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Vagas' })).toBeInTheDocument()
  })

  it('pins a teacher context to its own classes without a cave', () => {
    mocks.role = 'teacher'
    renderPage()

    expect(lastQuery()).toMatchObject({ teacherId: TEACHER_ID, page: 1 })
    expect(lastQuery().caveId).toBeUndefined()
  })

  it('opens the attendance panel from the compact class table', async () => {
    mocks.useClass.mockReturnValue({ isPending: false, isError: false, data: classItem() })
    mocks.useClasses.mockReturnValue(classPage([classItem({ enrolledCount: 8 })]))
    renderPage()

    expect(screen.getByRole('table', { name: 'Aulas' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Unidade' })).toBeInTheDocument()
    expect(screen.getByText('8 de 20')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Chamada' }))

    expect(screen.getByText('Chamada da unidade Consolação')).toBeInTheDocument()
  })

  it('navigates server pages and returns to the first one when a filter changes', async () => {
    mocks.useClasses.mockReturnValue(classPage([classItem()], 1, 3, 41))
    renderPage()

    const pagination = screen.getByRole('navigation', {
      name: 'Paginação de aulas',
    })
    expect(within(pagination).getByText('Página 1 de 3')).toBeInTheDocument()
    expect(
      within(pagination).getByRole('button', { name: 'Anterior' }),
    ).toBeDisabled()

    await userEvent.click(
      within(pagination).getByRole('button', { name: 'Próxima' }),
    )
    expect(lastQuery()).toMatchObject({ page: 2 })

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'EXAM')
    expect(lastQuery()).toMatchObject({ page: 1, type: 'EXAM' })
  })

  it('goes back to the last page when the current one no longer exists', async () => {
    // e.g. the only class of page 2 was deleted: the API now has 1 page.
    mocks.useClasses.mockImplementation((query: ClassListQuery) =>
      query.page === 1
        ? classPage([classItem()], 1, 2, 21)
        : classPage([], 2, 1, 20),
    )
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(mocks.useClasses).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
      true,
    )
    expect(lastQuery()).toMatchObject({ page: 1 })
    expect(
      screen.queryByText('Nenhuma aula encontrada'),
    ).not.toBeInTheDocument()
  })

  it('shows the teacher name from C1 and a fallback when the API omits it', () => {
    mocks.useClasses.mockReturnValue(
      classPage(
        [
          classItem({ id: 'c1', teacherName: 'Juliana Gracie' }),
          classItem({ id: 'c2', teacherId: 'unknown', teacherName: null }),
        ],
        1,
        1,
        2,
      ),
    )
    renderPage()

    expect(screen.getByText(/Juliana Gracie/)).toBeInTheDocument()
    expect(screen.getByText(/Professor não informado/)).toBeInTheDocument()
  })

  it('shows the loading state while the first page loads', () => {
    mocks.useClasses.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Carregando aulas…')
  })

  it('shows the empty state when the API returns no classes', () => {
    mocks.useClasses.mockReturnValue(classPage([], 1, 0, 0))
    renderPage()

    expect(screen.getByText('Nenhuma aula encontrada')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a retryable error when the classes fail to load', async () => {
    mocks.useClasses.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error('boom'),
      data: undefined,
      refetch: mocks.refetchClasses,
    })
    renderPage()

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar as aulas.')
    expect(
      screen.queryByText('Nenhuma aula encontrada'),
    ).not.toBeInTheDocument()

    await userEvent.click(
      within(alert).getByRole('button', { name: 'Tentar novamente' }),
    )
    expect(mocks.refetchClasses).toHaveBeenCalled()
  })

  it('reports a units failure as an error with retry, not as an empty list', async () => {
    mocks.useScopeUnits.mockReturnValue({
      units: [],
      isPending: false,
      isError: true,
      refetch: mocks.refetchUnits,
    })
    renderPage()

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar as unidades.')
    // The class list does not depend on the units, so it stays available.
    expect(screen.getByRole('table', { name: 'Aulas' })).toBeInTheDocument()
    expect(
      screen.queryByText('Nenhuma aula encontrada'),
    ).not.toBeInTheDocument()

    await userEvent.click(
      within(alert).getByRole('button', { name: 'Tentar novamente' }),
    )
    expect(mocks.refetchUnits).toHaveBeenCalled()
    expect(mocks.refetchTeachers).not.toHaveBeenCalled()
  })

  it('reports a teachers failure as an error with retry', async () => {
    mocks.useTeacherOptions.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: mocks.refetchTeachers,
    })
    renderPage()

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar os professores.')

    await userEvent.click(
      within(alert).getByRole('button', { name: 'Tentar novamente' }),
    )
    expect(mocks.refetchTeachers).toHaveBeenCalled()
    expect(mocks.refetchUnits).not.toHaveBeenCalled()
  })
})
