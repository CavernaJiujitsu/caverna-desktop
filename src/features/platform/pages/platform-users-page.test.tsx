import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PlatformUsersPage from '@/features/platform/pages/platform-users-page'
import { SessionProvider } from '@/shared/session/session-context'
import { writeStoredSession } from '@/shared/session/session-storage'
import type { UserAccessView } from '@/features/platform/schemas/user.schema'
import type { UserRole } from '@/shared/types/user-role'

const hookMocks = vi.hoisted(() => ({
  usePlatformUsers: vi.fn(),
  useAllPlatformUsers: vi.fn(),
  useUserAccess: vi.fn(),
  removeUser: vi.fn(),
  grant: vi.fn(),
  revoke: vi.fn(),
  create: vi.fn(),
}))

vi.mock('@/features/platform/hooks/use-platform-users', () => ({
  usePlatformUsers: hookMocks.usePlatformUsers,
  useAllPlatformUsers: hookMocks.useAllPlatformUsers,
  useUserAccess: hookMocks.useUserAccess,
  useRemovePlatformUser: () => ({
    isPending: false,
    mutateAsync: hookMocks.removeUser,
  }),
  useUserAccessMutations: () => ({
    grant: { isPending: false, mutateAsync: hookMocks.grant },
    revoke: { isPending: false, mutateAsync: hookMocks.revoke },
    create: { isPending: false, mutateAsync: hookMocks.create },
  }),
}))

vi.mock('@/features/platform/hooks/use-platform-caves', () => ({
  usePlatformCaves: () => ({
    isPending: false,
    isError: false,
    data: [
      {
        id: '770e8400-e29b-41d4-a716-446655440000',
        name: 'Caverna Centro',
        active: true,
        units: [
          {
            id: '880e8400-e29b-41d4-a716-446655440000',
            name: 'Sé',
            active: true,
          },
        ],
      },
    ],
  }),
}))

const ACTOR_ID = '990e8400-e29b-41d4-a716-446655440000'

const user = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Ana Silva',
  email: 'ana@caverna.app',
  role: 'TEACHER' as const,
  roles: ['TEACHER'] as UserRole[],
}

function accessView(overrides: Partial<UserAccessView> = {}): UserAccessView {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    primaryRole: 'TEACHER',
    roles: ['TEACHER'],
    isRoot: false,
    practitionerId: null,
    caveAdmin: null,
    teacher: {
      id: '660e8400-e29b-41d4-a716-446655440000',
      caveUnits: [
        {
          id: '880e8400-e29b-41d4-a716-446655440000',
          name: 'Sé',
          caveId: '770e8400-e29b-41d4-a716-446655440000',
        },
      ],
    },
    ...overrides,
  }
}

function signInAs(roles: UserRole[]) {
  writeStoredSession({
    session: {
      user: { id: ACTOR_ID, email: 'actor@caverna.app', name: 'Actor' },
      accessToken: 'token',
      expiresAt: Date.now() + 60_000,
      roles,
    },
    selectedContext: {
      id: `platform:${ACTOR_ID}`,
      role: 'platform',
      label: 'Administração da plataforma',
      detail: '',
    },
  })
}

function openDetail() {
  fireEvent.click(screen.getByRole('button', { name: 'Ver acessos' }))
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
    localStorage.clear()
    signInAs(['ADMIN'])
    hookMocks.usePlatformUsers.mockReset()
    hookMocks.useAllPlatformUsers.mockReset()
    hookMocks.useUserAccess.mockReset()
    hookMocks.removeUser.mockReset()
    hookMocks.grant.mockReset()
    hookMocks.revoke.mockReset()
    hookMocks.create.mockReset()

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
    hookMocks.useUserAccess.mockReturnValue({
      isPending: false,
      isError: false,
      data: accessView(),
      refetch: vi.fn(),
    })
    hookMocks.removeUser.mockResolvedValue(undefined)
  })

  it('requires the exact e-mail before enabling deletion', async () => {
    renderPage()

    openDetail()

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

  it('shows the role badges of each user', () => {
    renderPage()

    const list = screen.getByRole('list', { name: 'Usuários da plataforma' })
    expect(list).toHaveTextContent('Professor')
  })

  it('lists current access and revokes the teacher access', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    hookMocks.revoke.mockResolvedValue(accessView({ teacher: null }))
    renderPage()
    openDetail()

    const accessList = screen.getByRole('list', { name: 'Acessos atuais' })
    expect(accessList).toHaveTextContent('Sé')
    fireEvent.click(screen.getByRole('button', { name: 'Revogar' }))

    await waitFor(() => {
      expect(hookMocks.revoke).toHaveBeenCalledWith({
        userId: user.id,
        role: 'TEACHER',
      })
    })
  })

  it('grants cave admin access with the chosen cave', async () => {
    hookMocks.grant.mockResolvedValue(accessView())
    renderPage()
    openDetail()

    // TEACHER is already held, so CAVE_ADMIN is the first option.
    fireEvent.change(screen.getByLabelText('Caverna'), {
      target: { value: '770e8400-e29b-41d4-a716-446655440000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Conceder acesso' }))

    await waitFor(() => {
      expect(hookMocks.grant).toHaveBeenCalledWith({
        userId: user.id,
        input: {
          role: 'CAVE_ADMIN',
          caveId: '770e8400-e29b-41d4-a716-446655440000',
        },
      })
    })
  })

  it('offers the ADMIN access only to a ROOT actor', () => {
    renderPage()
    openDetail()
    const options = () =>
      Array.from(
        (screen.getByLabelText('Acesso') as HTMLSelectElement).options,
      ).map((option) => option.value)
    expect(options()).not.toContain('ADMIN')
    cleanup()

    localStorage.clear()
    signInAs(['ADMIN', 'ROOT'])
    renderPage()
    openDetail()
    expect(options()).toContain('ADMIN')
  })

  it.each([
    {
      name: 'the root user',
      access: accessView({ isRoot: true, roles: ['ADMIN', 'ROOT'] }),
      actorRoles: ['ADMIN', 'ROOT'] as UserRole[],
      reason: /root não pode/,
    },
    {
      name: 'the signed-in user',
      access: accessView({ userId: ACTOR_ID }),
      actorRoles: ['ADMIN'] as UserRole[],
      reason: /próprios acessos/,
    },
    {
      name: 'an admin when the actor is not root',
      access: accessView({ roles: ['ADMIN'], primaryRole: 'ADMIN' }),
      actorRoles: ['ADMIN'] as UserRole[],
      reason: /Somente o usuário root/,
    },
  ])('locks every action for $name', ({ access, actorRoles, reason }) => {
    localStorage.clear()
    signInAs(actorRoles)
    hookMocks.useUserAccess.mockReturnValue({
      isPending: false,
      isError: false,
      data: access,
      refetch: vi.fn(),
    })
    renderPage()
    openDetail()

    expect(screen.getByRole('note')).toHaveTextContent(reason)
    expect(screen.queryByRole('button', { name: 'Revogar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Conceder acesso' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Remover usuário/ })).toBeNull()
  })

  it('creates a management user and opens its access detail', async () => {
    hookMocks.create.mockResolvedValue(accessView())
    renderPage()

    fireEvent.click(
      screen.getByRole('button', { name: /Novo usuário de gestão/ }),
    )
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Bia' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'bia@caverna.app' },
    })
    fireEvent.change(screen.getByLabelText('Senha inicial'), {
      target: { value: 'senha-forte' },
    })
    fireEvent.change(screen.getByLabelText('Caverna'), {
      target: { value: '770e8400-e29b-41d4-a716-446655440000' },
    })
    fireEvent.click(screen.getByLabelText('Sé'))
    fireEvent.click(screen.getByRole('button', { name: /Criar usuário/ }))

    await waitFor(() => {
      expect(hookMocks.create).toHaveBeenCalledWith({
        name: 'Bia',
        email: 'bia@caverna.app',
        password: 'senha-forte',
        role: 'TEACHER',
        caveUnitIds: ['880e8400-e29b-41d4-a716-446655440000'],
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Acessos do usuário' }),
    ).toBeInTheDocument()
  })
})
