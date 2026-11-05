import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { AcademyForm } from '@/features/academies/components/academy-form'

vi.mock('@/shared/lib/notifications', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

it('shows a Zod error and does not submit an empty name', async () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AcademyForm />
    </QueryClientProvider>,
  )
  await userEvent.click(
    screen.getByRole('button', { name: 'Add academy' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent('Enter a name')
  expect(screen.getByLabelText('Academy name')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
})
