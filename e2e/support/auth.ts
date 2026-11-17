import { expect, type Page } from '@playwright/test'
import { SEED_PASSWORD } from './api'

export const ACCOUNTS = {
  platform: 'admin@caverna.com',
  academy: 'admin.caverna@caverna.com',
  teacher: 'mestre.semente@caverna.com',
} as const

type ContextRole = 'Plataforma' | 'Academia' | 'Professor'

/** Signs in through the real login form and stops on the context screen. */
export async function loginViaUi(
  page: Page,
  email: string,
  password = SEED_PASSWORD,
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/management$/)
  await expect(
    page.getByRole('heading', { name: 'Como você quer entrar?' }),
  ).toBeVisible()
}

/** Confirms a context and waits for its landing route. */
export async function selectContext(
  page: Page,
  label: string,
  role: ContextRole,
): Promise<void> {
  await page
    .getByRole('button', { name: `Selecionar ${label}, ${role}` })
    .click()
  await expect(page).not.toHaveURL(/\/management$/)
}

export async function signInAs(
  page: Page,
  account: keyof typeof ACCOUNTS,
  context?: { label: string; role: ContextRole },
): Promise<void> {
  await loginViaUi(page, ACCOUNTS[account])
  if (context) await selectContext(page, context.label, context.role)
}
