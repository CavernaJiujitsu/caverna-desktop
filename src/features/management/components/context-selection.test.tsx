import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ContextSelection } from '@/features/management/components/context-selection'
import type { ManagementContext } from '@/shared/types/management-context'

const contexts: ManagementContext[] = [
  { id: 'one', role: 'academy', label: 'Academia A', detail: 'Exemplo' },
  { id: 'two', role: 'teacher', label: 'Professor B', detail: 'Exemplo' },
]

it('offers only supplied contexts and supports keyboard selection', async () => {
  const onSelect = vi.fn()
  render(
    <ContextSelection
      contexts={contexts}
      status="success"
      onSelect={onSelect}
      onRetry={vi.fn()}
    />,
  )
  expect(screen.getAllByRole('button', { name: /Selecionar/ })).toHaveLength(2)
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledWith(contexts[0])
})

it('renders empty and recoverable error states without context options', async () => {
  const onRetry = vi.fn()
  const view = render(
    <ContextSelection
      contexts={[]}
      status="success"
      onSelect={vi.fn()}
      onRetry={onRetry}
    />,
  )
  expect(screen.getByText('Nenhum contexto disponível')).toBeInTheDocument()
  view.rerender(
    <ContextSelection
      contexts={contexts}
      status="error"
      onSelect={vi.fn()}
      onRetry={onRetry}
    />,
  )
  expect(
    screen.queryByRole('button', { name: /Selecionar/ }),
  ).not.toBeInTheDocument()
  await userEvent.click(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  )
  expect(onRetry).toHaveBeenCalledOnce()
})
