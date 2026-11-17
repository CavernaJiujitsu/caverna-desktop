import { expect, test } from '@playwright/test'
import { loginViaUi, selectContext, ACCOUNTS } from '../support/auth'

test.describe('jornada 1: login por papel e troca de contexto', () => {
  test('plataforma entra no contexto platform e não vê rotas de treino', async ({
    page,
  }) => {
    await loginViaUi(page, ACCOUNTS.platform)
    await selectContext(page, 'Administração da plataforma', 'Plataforma')

    await expect(page).toHaveURL(/\/platform\/caves$/)
    await expect(
      page.getByRole('link', { name: 'Usuários e acessos' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Aulas' })).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'Validações de faixa' }),
    ).toHaveCount(0)
  })

  test('academia entra em /classes e troca de contexto sem perder a sessão', async ({
    page,
  }) => {
    await loginViaUi(page, ACCOUNTS.academy)
    await selectContext(page, 'Caverna Matriz', 'Academia')

    await expect(page).toHaveURL(/\/classes$/)
    await expect(page.getByRole('link', { name: 'Aulas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Alunos' })).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Validações de faixa' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Usuários e acessos' }),
    ).toHaveCount(0)

    await page.getByRole('button', { name: 'Trocar contexto' }).click()
    await expect(page).toHaveURL(/\/management$/)
    await selectContext(page, 'Caverna Matriz', 'Academia')
    await expect(page).toHaveURL(/\/classes$/)

    await page.reload()
    await expect(page).toHaveURL(/\/classes$/)
  })

  test('professor entra no contexto teacher e só vê as rotas dele', async ({
    page,
  }) => {
    await loginViaUi(page, ACCOUNTS.teacher)
    await selectContext(page, 'Mestre Semente', 'Professor')

    await expect(page).toHaveURL(/\/classes$/)
    await expect(page.getByRole('link', { name: 'Minhas aulas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Validações' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Alunos' })).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'Usuários e acessos' }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Minhas aulas' }),
    ).toBeVisible()
  })
})
