import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Button } from '@/shared/components/ui/button'

it('renders a keyboard-accessible button and invokes its action', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Add academy</Button>)
  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Add academy' })).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  expect(onClick).toHaveBeenCalledOnce()
})
