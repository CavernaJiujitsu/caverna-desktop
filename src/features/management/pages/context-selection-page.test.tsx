import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from '@/shared/session/session-context'
import { useSession } from '@/shared/session/session'
import {
  getManagementContextId,
  setAccessToken,
  setManagementContextId,
} from '@/shared/session/access-token'
import { queryClient } from '@/shared/lib/query-client'
import { AppError } from '@/shared/types/app-error'
import type { ManagementContext } from '@/shared/types/management-context'
import { managementContextService } from '@/features/management/services/management-context.service'
import ContextSelectionPage from './context-selection-page'

vi.mock('@/features/management/services/management-context.service', () => ({
  managementContextService: { list: vi.fn(), switch: vi.fn() },
}))
const list = vi.mocked(managementContextService.list)
const choose = vi.mocked(managementContextService.switch)
const academy: ManagementContext = {
  id: 'ctx-academy',
  role: 'academy',
  label: 'Academia A',
  detail: 'Gestão da unidade',
}
const teacher: ManagementContext = {
  id: 'ctx-teacher',
  role: 'teacher',
  label: 'Professor B',
  detail: 'Unidade B',
}
const defaults = queryClient.getDefaultOptions()

function WithSession({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useSession()
  useEffect(() => {
    setSession({
      user: { id: 'user-1', email: 'qa@caverna.test', name: null },
      accessToken: 'token',
    })
  }, [setSession])
  return session ? children : null
}
function mount() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management']}>
        <SessionProvider>
          <Routes>
            <Route
              path="/management"
              element={
                <WithSession>
                  <ContextSelectionPage />
                </WithSession>
              }
            />
            <Route path="/academies" element={<p>Academies route</p>} />
            <Route path="/classes" element={<p>Teacher route</p>} />
            <Route path="/login" element={<p>Login route</p>} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
describe('real context selection', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    queryClient.clear()
    queryClient.setDefaultOptions({ queries: { retry: false } })
    list.mockResolvedValue([academy, teacher])
  })
  afterEach(() => {
    queryClient.clear()
    queryClient.setDefaultOptions(defaults)
    setAccessToken(null)
    setManagementContextId(null)
  })
  it('loads only server contexts with no automatic selection', async () => {
    mount()
    expect(
      await screen.findByRole('button', { name: /Selecionar Academia A/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Academia A')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Selecionar Professor B/ }),
    ).toBeInTheDocument()
    expect(getManagementContextId()).toBeNull()
    expect(choose).not.toHaveBeenCalled()
  })
  it('shows an empty state without granting a local context', async () => {
    list.mockResolvedValue([])
    mount()
    expect(
      await screen.findByText('Nenhum contexto disponível'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Selecionar/ }),
    ).not.toBeInTheDocument()
    expect(getManagementContextId()).toBeNull()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })
  it('recovers from a list failure without inventing access', async () => {
    list.mockRejectedValueOnce(new AppError('network', 'failed'))
    mount()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Tentar novamente' }),
    )
    expect(
      await screen.findByRole('button', { name: /Selecionar Academia A/ }),
    ).toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(2)
    expect(getManagementContextId()).toBeNull()
  })
  it('keeps protected areas closed after a refused switch', async () => {
    choose.mockRejectedValue(new AppError('forbidden', 'denied', 403))
    mount()
    fireEvent.click(
      await screen.findByRole('button', { name: /Selecionar Academia A/ }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esse acesso não está mais disponível',
    )
    expect(screen.queryByText('Academies route')).not.toBeInTheDocument()
    expect(getManagementContextId()).toBeNull()
    list.mockResolvedValue([])
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar contextos' }))
    expect(
      await screen.findByText('Nenhum contexto disponível'),
    ).toBeInTheDocument()
  })
  it('blocks duplicate selection until the server confirms and uses its role', async () => {
    let confirm!: (context: ManagementContext) => void
    choose.mockReturnValue(
      new Promise((resolve) => {
        confirm = resolve
      }),
    )
    mount()
    const option = await screen.findByRole('button', {
      name: /Selecionar Professor B/,
    })
    fireEvent.click(option)
    fireEvent.click(option)
    await vi.waitFor(() => expect(choose).toHaveBeenCalledTimes(1))
    expect(
      screen.getByRole('button', { name: /Selecionar Academia A/ }),
    ).toBeDisabled()
    expect(getManagementContextId()).toBeNull()
    await act(async () => {
      confirm({ ...teacher, label: 'Nome confirmado' })
    })
    expect(await screen.findByText('Teacher route')).toBeInTheDocument()
    expect(getManagementContextId()).toBe(teacher.id)
  })
  it('does not navigate or restore context after logout while selection is pending', async () => {
    let confirm!: (context: ManagementContext) => void
    choose.mockReturnValue(
      new Promise((resolve) => {
        confirm = resolve
      }),
    )
    mount()
    fireEvent.click(
      await screen.findByRole('button', { name: /Selecionar Academia A/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await screen.findByText('Login route')).toBeInTheDocument()
    await act(async () => {
      confirm(academy)
    })
    expect(screen.getByText('Login route')).toBeInTheDocument()
    expect(getManagementContextId()).toBeNull()
  })
})
