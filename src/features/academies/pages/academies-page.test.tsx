import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import AcademiesPage from '@/features/academies/pages/academies-page'

vi.mock('@/features/academies/hooks/use-academies', () => ({
  useAcademies: () => ({ isPending: false, isError: true, refetch: vi.fn() }),
  useCreateAcademy: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

it('renders an actionable load error state', () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AcademiesPage demo />
    </QueryClientProvider>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not load academies',
  )
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
})
