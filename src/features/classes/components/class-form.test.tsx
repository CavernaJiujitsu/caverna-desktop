import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClassForm } from '@/features/classes/components/class-form'
import type { ClassScope } from '@/features/classes/hooks/use-class-scope'

vi.mock('@/features/classes/hooks/use-classes', () => ({
  useClassMutations: () => ({ save: { isPending: false, mutateAsync: vi.fn() } }),
}))

vi.mock('@/features/belts/hooks/use-belts', () => ({
  useBelts: () => ({ isPending: false, isError: false, data: [] }),
}))

function academyScope(overrides: Partial<ClassScope> = {}): ClassScope {
  return {
    isTeacher: false,
    caveId: '9157d890-613d-43b8-960a-b090a7af17e2',
    ownTeacherId: '',
    units: [],
    unitsPending: false,
    unitsError: false,
    teachers: [],
    teachersPending: false,
    teachersError: false,
    retryCatalogs: vi.fn(),
    teacherName: () => 'Professor não informado',
    ...overrides,
  }
}

describe('ClassForm catalogs', () => {
  it('says the units failed to load instead of offering an empty choice', () => {
    render(
      <ClassForm
        value={null}
        scope={academyScope({ unitsError: true })}
        onClose={vi.fn()}
      />,
    )

    const units = screen.getByLabelText('Unidade')
    expect(units).toBeDisabled()
    expect(units).toHaveDisplayValue('Não foi possível carregar as unidades')
  })

  it('says the teachers failed to load instead of "Nenhum professor"', () => {
    render(
      <ClassForm
        value={null}
        scope={academyScope({ teachersError: true })}
        onClose={vi.fn()}
      />,
    )

    const teachers = screen.getByLabelText('Professor')
    expect(teachers).toBeDisabled()
    expect(teachers).toHaveDisplayValue(
      'Não foi possível carregar os professores',
    )
    expect(
      screen.queryByText('Nenhum professor nesta unidade'),
    ).not.toBeInTheDocument()
  })
})
