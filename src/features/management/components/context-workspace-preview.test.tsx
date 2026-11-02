import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ContextWorkspacePreview } from '@/features/management/components/context-workspace-preview'

it('shows role-specific preview areas and lets the user switch them', async () => {
  render(
    <ContextWorkspacePreview
      context={{
        id: 'teacher',
        role: 'teacher',
        label: 'Professor (exemplo)',
        detail: 'Prévia',
      }}
      onSwitch={vi.fn()}
      onExit={vi.fn()}
    />,
  )
  expect(
    screen.getByRole('navigation', {
      name: 'Navegação de Professor (exemplo)',
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Minhas aulas' }),
  ).toBeInTheDocument()
  expect(screen.queryByText('Academias')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Alunos' }))
  expect(screen.getByRole('heading', { name: 'Alunos' })).toBeInTheDocument()
})
