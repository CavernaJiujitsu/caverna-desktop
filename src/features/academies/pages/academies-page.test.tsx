import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import AcademiesPage from '@/features/academies/pages/academies-page'
import { SessionProvider } from '@/shared/session/session-context'

vi.mock('@/features/academies/hooks/use-academies', () => ({
  useAcademies: () => ({ isPending: false, isError: true, refetch: vi.fn() }),
  useCreateAcademy: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useAcademyMutations: () => ({
    update: { isPending: false, mutateAsync: vi.fn() },
    remove: { isPending: false, mutate: vi.fn() },
    createUnit: { isPending: false, mutateAsync: vi.fn() },
    updateUnit: { isPending: false, mutateAsync: vi.fn() },
    removeUnit: { isPending: false, mutate: vi.fn() },
  }),
}))

it('renders an actionable load error state', () => {
  render(
    <MemoryRouter>
      <SessionProvider>
        <QueryClientProvider client={new QueryClient()}>
          <AcademiesPage />
        </QueryClientProvider>
      </SessionProvider>
    </MemoryRouter>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Não foi possível carregar as cavernas.',
  )
  expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
})
