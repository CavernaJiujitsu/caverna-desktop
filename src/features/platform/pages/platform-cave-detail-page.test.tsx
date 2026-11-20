import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import type { ClassItem } from '@/features/classes/schemas/class.schema'
import { UnitClassesPreview } from './platform-cave-detail-page'

const classes: ClassItem[] = Array.from({ length: 19 }, (_, index) => ({
  id: `class-${index}`,
  type: 'SCHEDULED',
  startsAt: `2026-11-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
  endsAt: `2026-11-${String(index + 1).padStart(2, '0')}T13:30:00Z`,
  capacity: 25,
  caveUnitId: 'unit-1',
  caveUnitName: 'Brasilândia',
  caveName: 'Caverna SP',
  teacherId: 'teacher-1',
  teacherName: `Professor ${index + 1}`,
  belts: [],
}))

it('shows eight classes per page, preserving access to the rest', async () => {
  render(
    <UnitClassesPreview
      unitName="Brasilândia"
      items={classes}
      loading={false}
    />,
  )
  const user = userEvent.setup()
  const list = screen.getByRole('list', {
    name: 'Aulas da unidade Brasilândia',
  })
  const pager = screen.getByRole('navigation', {
    name: 'Paginação das aulas de Brasilândia',
  })

  expect(within(list).getAllByRole('listitem')).toHaveLength(8)
  expect(screen.getByText('Aulas (19)')).toBeInTheDocument()
  expect(
    within(pager).getByText(/1–8 de 19 · Página 1 de 3/),
  ).toBeInTheDocument()
  expect(within(pager).getByRole('button', { name: 'Anterior' })).toBeDisabled()

  await user.click(within(pager).getByRole('button', { name: 'Próxima' }))
  expect(within(list).getAllByRole('listitem')).toHaveLength(8)
  expect(within(list).getByText('Professor 9')).toBeInTheDocument()
  await user.click(within(pager).getByRole('button', { name: 'Próxima' }))
  expect(within(list).getAllByRole('listitem')).toHaveLength(3)
  expect(within(pager).getByRole('button', { name: 'Próxima' })).toBeDisabled()
})

it('keeps pages independent between units', async () => {
  render(
    <>
      <UnitClassesPreview
        unitName="Brasilândia"
        items={classes}
        loading={false}
      />
      <UnitClassesPreview unitName="Santana" items={classes} loading={false} />
    </>,
  )
  await userEvent
    .setup()
    .click(
      within(
        screen.getByRole('navigation', {
          name: 'Paginação das aulas de Brasilândia',
        }),
      ).getByRole('button', { name: 'Próxima' }),
    )
  expect(
    within(
      screen.getByRole('list', { name: 'Aulas da unidade Santana' }),
    ).getByText('Professor 1'),
  ).toBeInTheDocument()
  expect(
    within(
      screen.getByRole('list', { name: 'Aulas da unidade Brasilândia' }),
    ).getByText('Professor 9'),
  ).toBeInTheDocument()
})
