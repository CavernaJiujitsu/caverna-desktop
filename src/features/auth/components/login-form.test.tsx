import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { LoginForm } from '@/features/auth/components/login-form'
import { AppError } from '@/shared/types/app-error'

it('validates fields before calling the login boundary', async () => {
  const onSubmit = vi.fn(async () => {})
  render(<LoginForm onSubmit={onSubmit} />)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(
    await screen.findByText('Informe um e-mail válido.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

it('prevents repeated submission while pending and shows a safe credential error', async () => {
  let rejectLogin: (reason: unknown) => void = () => {}
  const onSubmit = vi.fn(
    () =>
      new Promise<void>((_resolve, reject) => {
        rejectLogin = reject
      }),
  )
  render(<LoginForm onSubmit={onSubmit} />)
  await userEvent.type(screen.getByLabelText('E-mail'), 'pessoa@exemplo.com')
  await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(
    await screen.findByRole('button', { name: 'Entrando…' }),
  ).toBeDisabled()
  expect(onSubmit).toHaveBeenCalledOnce()
  rejectLogin(new AppError('unauthorized', 'Internal credential detail', 401))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'E-mail ou senha inválidos.',
  )
  expect(
    screen.queryByText(/Internal credential detail/),
  ).not.toBeInTheDocument()
})

it('toggles password visibility with an accessible control', async () => {
  render(<LoginForm onSubmit={async () => {}} />)
  expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
  expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
  expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
