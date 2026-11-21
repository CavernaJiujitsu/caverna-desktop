import { expect, test } from '@playwright/test'

test('catálogo apresenta o painel de faixas e permite editar sem exibir formulários permanentes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('caverna.desktop.session', JSON.stringify({
      version: 1,
      session: {
        user: { id: 'admin', email: 'admin@caverna.local', name: 'Administrador' },
        accessToken: 'visual-check',
        roles: ['ADMIN'],
        expiresAt: Date.now() + 60 * 60 * 1000,
      },
      selectedContext: { id: 'platform', role: 'platform', label: 'Plataforma', detail: 'Administração' },
    }))
  })
  const white = '10000000-0000-4000-8000-000000000001'
  const blue = '10000000-0000-4000-8000-000000000002'
  const stage = '20000000-0000-4000-8000-000000000001'
  const movement = '30000000-0000-4000-8000-000000000001'
  const catalog = {
    belts: [
      { id: white, name: 'Branca', color: 'WHITE', level: 1, minimumTrainingMinutes: 0, minimumTrainingClasses: 0 },
      { id: blue, name: 'Azul', color: 'BLUE', level: 2, minimumTrainingMinutes: 1200, minimumTrainingClasses: 40 },
    ],
    movements: [{ id: movement, name: 'Rolamento', description: 'Movimento base de deslocamento' }],
    trails: [{
      id: '40000000-0000-4000-8000-000000000001',
      belt: { id: white },
      stages: [{
        id: stage,
        name: 'Fundamentos',
        position: 1,
        movements: [{
          id: '50000000-0000-4000-8000-000000000001',
          position: 1,
          required: true,
          movement: { id: movement, name: 'Rolamento', description: 'Movimento base de deslocamento' },
        }],
      }],
    }],
    minimumPracticeClasses: 2,
  }
  await page.route('**/api/v1/graduation-catalog', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: catalog }) }),
  )
  await page.route('**/api/v1/platform/users**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { data: [], _meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } }),
    }),
  )
  await page.goto('/platform/graduation-catalog')
  await expect(page.getByRole('heading', { name: 'Catálogo de faixas' })).toBeVisible()
  const sidebarClass = await page.locator('aside').first().getAttribute('class')
  await expect(page.getByRole('link', { name: 'Catálogo de faixas' })).toHaveClass(/bg-primary/)
  await expect(page.getByRole('heading', { name: 'Movimentos globais' })).toBeVisible()
  await expect(page.getByText('Fundamentos')).toBeVisible()
  await expect(page.getByRole('button', { name: '+ Associar movimento' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Nome da faixa' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Editar faixa Branca' }).click()
  await expect(page.getByRole('dialog', { name: 'Editar faixa Branca' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Nome da faixa' })).toHaveValue('Branca')
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.setViewportSize({ width: 760, height: 900 })
  await expect(page.getByRole('heading', { name: 'Catálogo de faixas' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.goto('/platform/users')
  await expect(page.getByRole('link', { name: 'Usuários e acessos' })).toHaveClass(/bg-primary/)
  expect(await page.locator('aside').first().getAttribute('class')).toBe(sidebarClass)
})
