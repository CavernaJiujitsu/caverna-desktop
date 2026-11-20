import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import type { ClassItem } from '@/features/classes/schemas/class.schema'
import type { PlatformCaveUnit } from '@/features/platform/schemas/cave.schema'
import {
  PlatformUnitsTable,
  UnitClassesPreview,
} from './platform-cave-detail-page'

const mocks = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/features/classes/services/class.service', () => ({
  classService: { list: mocks.list },
}))

beforeEach(() => mocks.list.mockReset())

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
  await userEvent.setup().click(
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

const units: PlatformCaveUnit[] = Array.from({ length: 12 }, (_, index) => ({
  id: `unit-${index}`,
  name: index === 11 ? 'São José' : `Unidade ${index + 1}`,
  active: true,
  address: 'Rua do Tatame',
}))
const firstUnit: PlatformCaveUnit = {
  id: 'unit-0',
  name: 'Unidade 1',
  active: true,
  address: 'Rua do Tatame',
}

it('shows a compact paginated table and searches all units by accent-insensitive name', async () => {
  const user = userEvent.setup()
  render(<PlatformUnitsTable units={units} date={null} />)
  const table = screen.getByRole('table', { name: 'Unidades da caverna' })
  const pager = screen.getByRole('navigation', {
    name: 'Paginação das unidades',
  })
  expect(within(table).getAllByRole('row')).toHaveLength(11)
  expect(mocks.list).not.toHaveBeenCalled()
  await user.click(within(pager).getByRole('button', { name: 'Próxima' }))
  expect(within(table).getByText('São José')).toBeInTheDocument()
  await user.type(
    screen.getByRole('searchbox', { name: 'Pesquisar unidade' }),
    '  sao jose ',
  )
  expect(within(table).getAllByRole('row')).toHaveLength(2)
  expect(screen.getByText('1 de 12 unidades')).toBeInTheDocument()
  expect(
    screen.queryByRole('navigation', { name: 'Paginação das unidades' }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Limpar' }))
  expect(within(table).getAllByRole('row')).toHaveLength(11)
})

it('shows a distinct no-results state and loads classes only when expanded', async () => {
  mocks.list.mockResolvedValue(classes)
  const user = userEvent.setup()
  render(<PlatformUnitsTable units={[firstUnit]} date={null} />)
  expect(mocks.list).not.toHaveBeenCalled()
  await user.type(
    screen.getByRole('searchbox', { name: 'Pesquisar unidade' }),
    'nada',
  )
  expect(
    screen.getByText('Nenhuma unidade corresponde à pesquisa'),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Limpar' }))
  await user.click(screen.getByRole('button', { name: 'Ver aulas' }))
  await waitFor(() =>
    expect(screen.getByText('Aulas (19)')).toBeInTheDocument(),
  )
  expect(mocks.list).toHaveBeenCalledTimes(1)
  expect(mocks.list).toHaveBeenCalledWith(
    expect.objectContaining({ caveUnitId: 'unit-0' }),
    expect.any(AbortSignal),
  )
  await user.click(screen.getByRole('button', { name: 'Ocultar aulas' }))
  expect(screen.queryByText('Aulas (19)')).not.toBeInTheDocument()
})

it('allows retry when loading classes fails', async () => {
  mocks.list
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(classes)
  render(<PlatformUnitsTable units={[firstUnit]} date={null} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Ver aulas' }))
  await user.click(
    await screen.findByRole('button', { name: 'Tentar novamente' }),
  )
  await waitFor(() =>
    expect(screen.getByText('Aulas (19)')).toBeInTheDocument(),
  )
  expect(mocks.list).toHaveBeenCalledTimes(2)
})
