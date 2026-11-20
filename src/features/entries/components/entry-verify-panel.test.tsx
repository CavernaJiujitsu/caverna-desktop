import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { EntryVerifyPanel } from './entry-verify-panel'

const mocks = vi.hoisted(() => ({ verifyEntry: vi.fn() }))
vi.mock('@/features/entries/services/entry.service', () => ({
  verifyEntry: mocks.verifyEntry,
}))

beforeEach(() => vi.clearAllMocks())

it('verifies entry separately from attendance and rejects reused code', async () => {
  mocks.verifyEntry.mockResolvedValueOnce({
    studentName: 'Aluno A',
    enrollmentId: 'enrollment-1',
  })
  render(<EntryVerifyPanel />)
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: 'Código de acesso' }), 'cav-abcdef0123456789')
  await user.click(screen.getByRole('button', { name: 'Conferir código' }))
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Entrada liberada para Aluno A. A presença na aula ainda precisa ser confirmada pelo professor.',
  )
  expect(mocks.verifyEntry).toHaveBeenCalledWith('CAV-ABCDEF0123456789')
})

it('does not send malformed codes', async () => {
  render(<EntryVerifyPanel />)
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: 'Código de acesso' }), 'CAV-1234')
  await user.click(screen.getByRole('button', { name: 'Conferir código' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Informe o código')
  expect(mocks.verifyEntry).not.toHaveBeenCalled()
})
