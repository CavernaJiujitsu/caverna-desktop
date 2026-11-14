import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PlatformUsersPage from '@/features/platform/pages/platform-users-page'
import { SessionProvider } from '@/shared/session/session-context'

const hookMocks = vi.hoisted(() => ({
  usePlatformUsers: vi.fn(),
  useAllPlatformUsers: vi.fn(),
  usePlatformUser: vi.fn(),
  removeUser: vi.fn(),
}))

vi.mock('@/features/platform/hooks/use-platform-users', () => ({
  usePlatformUsers: hookMocks.usePlatformUsers,
  useAllPlatformUsers: hookMocks.useAllPlatformUsers,
  usePlatformUser: hookMocks.usePlatformUser,
  useRemovePlatformUser: () => ({
    isPending: false,
    mutateAsync: hookMocks.removeUser,
  }),
}))

const user = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Ana Silva',
  email: 'ana@caverna.app',
  role: 'TEACHER' as const,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SessionProvider>
        <PlatformUsersPage />
      </SessionProvider>
    </MemoryRouter>,
  )
}

describe('PlatformUsersPage', () => {
  beforeEach(() => {
    hookMocks.usePlatformUsers.mockReset()
    hookMocks.useAllPlatformUsers.mockReset()
    hookMocks.usePlatformUser.mockReset()
    hookMocks.removeUser.mockReset()

    hookMocks.usePlatformUsers.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [user],
        page: 1,
        totalPage: 1,
        total: 1,
      },
      refetch: vi.fn(),
    })
    hookMocks.useAllPlatformUsers.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [user],
        page: 1,
        totalPage: 1,
        total: 1,
      },
      refetch: vi.fn(),
    })
    hookMocks.usePlatformUser.mockReturnValue({
      isPending: false,
      isError: false,
      data: user,
      refetch: vi.fn(),
    })
    hookMocks.removeUser.mockResolvedValue(undefined)
  })

  it('requires the exact e-mail before enabling deletion', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))

    const deleteButton = screen.getByRole('button', { name: /Remover usuário/ })
    expect(deleteButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Confirmação'), {
      target: { value: 'ana@outra.app' },
    })
    expect(deleteButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Confirmação'), {
      target: { value: user.email },
    })
    expect(deleteButton).toBeEnabled()

    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(hookMocks.removeUser).toHaveBeenCalledWith(user.id)
    })
  })

  it('searches through the backend query', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Buscar por nome ou e-mail'), {
      target: { value: 'ana' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(hookMocks.usePlatformUsers).toHaveBeenLastCalledWith(
        {
          page: 1,
          limit: 10,
          search: 'ana',
        },
        { enabled: true },
      )
    })
  })

  it('applies the profile and page-size filters and resets the page', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Perfil'), {
      target: { value: 'TEACHER' },
    })

    await waitFor(() => {
      expect(hookMocks.usePlatformUsers).toHaveBeenLastCalledWith(
        { page: 1, limit: 10, role: 'TEACHER' },
        { enabled: true },
      )
    })

    fireEvent.change(screen.getByLabelText('Itens por página'), {
      target: { value: '50' },
    })

    await waitFor(() => {
      expect(hookMocks.usePlatformUsers).toHaveBeenLastCalledWith(
        { page: 1, limit: 50, role: 'TEACHER' },
        { enabled: true },
      )
    })
  })

  it('navigates between pages', async () => {
    hookMocks.usePlatformUsers.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [user],
        page: 1,
        totalPage: 3,
        total: 21,
      },
      refetch: vi.fn(),
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    await waitFor(() => {
      expect(hookMocks.usePlatformUsers).toHaveBeenLastCalledWith(
        { page: 2, limit: 10 },
        { enabled: true },
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))

    await waitFor(() => {
      expect(hookMocks.usePlatformUsers).toHaveBeenLastCalledWith(
        { page: 1, limit: 10 },
        { enabled: true },
      )
    })
  })

  it('loads every matching page when Todos is selected', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Itens por página'), {
      target: { value: 'all' },
    })

    await waitFor(() => {
      expect(hookMocks.useAllPlatformUsers).toHaveBeenLastCalledWith(
        {},
        { enabled: true },
      )
    })
    expect(hookMocks.usePlatformUsers).toHaveBeenLastCalledWith(
      { page: 1, limit: 100 },
      { enabled: false },
    )
  })
})
