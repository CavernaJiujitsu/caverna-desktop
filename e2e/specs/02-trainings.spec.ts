import { expect, test } from '@playwright/test'
import {
  createClass,
  createPractitioner,
  discoverClassScope,
  enroll,
  futureSlot,
  loginApi,
  uniqueCapacity,
} from '../support/api'
import { ACCOUNTS, signInAs } from '../support/auth'

/**
 * Journey 2: the trainings list, the roster expansion and the 31-day period
 * limit. Data is created through the real API and never deleted.
 */
test.describe('jornada 2: treinos', () => {
  test('academia lista o treino, expande os alunos e limita o período a 31 dias', async ({
    page,
    request,
  }) => {
    const adminToken = await loginApi(request, ACCOUNTS.platform)
    const scope = await discoverClassScope(request, adminToken)
    const student = await createPractitioner(request, 'treinos')
    const slot = futureSlot(2, 0)
    const capacity = uniqueCapacity(1)
    const classId = await createClass(
      request,
      adminToken,
      scope,
      slot,
      capacity,
    )
    await enroll(request, adminToken, classId, student.id)

    await signInAs(page, 'academy', {
      label: 'Caverna Matriz',
      role: 'Academia',
    })
    await page.getByRole('link', { name: 'Treinos' }).click()
    await expect(page).toHaveURL(/\/trainings$/)
    const filters = page.getByRole('region', { name: 'Filtros de treinos' })
    await expect(filters).toBeVisible()
    await filters
      .getByRole('combobox', { name: 'Unidade', exact: true })
      .selectOption({ label: 'Centro' })

    await filters.getByLabel('De', { exact: true }).fill(slot.dateInput)
    await filters.getByLabel('Até', { exact: true }).fill(slot.dateInput)

    const row = page
      .locator('ul[aria-label="Treinos"] > li')
      .filter({ hasText: slot.timeLabel })
      .filter({ hasText: `1/${capacity} alunos` })
    await expect(row).toHaveCount(1)

    // Expanding the row is what loads the roster; the class card alone does not.
    await row.locator('button[aria-expanded]').click()
    const roster = row.getByRole('list', { name: 'Alunos do treino' })
    await expect(roster).toBeVisible()
    await expect(roster.getByText(student.name)).toBeVisible()
    await expect(roster.getByText(student.email)).toBeVisible()
    await expect(roster.getByText('Inscrito')).toBeVisible()
    await expect(
      row.getByRole('link', { name: 'Gerenciar aula' }),
    ).toBeVisible()

    // A range longer than 31 days is not rejected: the end date is limited.
    await filters.getByLabel('Até', { exact: true }).fill('2099-12-31')
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'O período máximo é de 31 dias.' }),
    ).toBeVisible()
    await expect(page.getByText(/A data final foi limitada a/)).toBeVisible()
  })

  test('plataforma vê treinos e alunos, mas não recebe atalhos de gestão da aula', async ({
    page,
    request,
  }) => {
    const adminToken = await loginApi(request, ACCOUNTS.platform)
    const scope = await discoverClassScope(request, adminToken)
    const student = await createPractitioner(request, 'treinos-plataforma')
    const slot = futureSlot(2, 1)
    const capacity = uniqueCapacity(2)
    const classId = await createClass(
      request,
      adminToken,
      scope,
      slot,
      capacity,
    )
    await enroll(request, adminToken, classId, student.id)

    await signInAs(page, 'platform', {
      label: 'Administração da plataforma',
      role: 'Plataforma',
    })
    await page.getByRole('link', { name: 'Treinos' }).click()
    await expect(page).toHaveURL(/\/trainings$/)
    const filters = page.getByRole('region', { name: 'Filtros de treinos' })
    await expect(filters).toBeVisible()
    // Scoping to one unit keeps the row on the first page of results.
    await filters
      .getByRole('combobox', { name: 'Caverna', exact: true })
      .selectOption({ label: 'Caverna Matriz' })
    await filters
      .getByRole('combobox', { name: 'Unidade', exact: true })
      .selectOption({ label: 'Centro' })

    await filters.getByLabel('De', { exact: true }).fill(slot.dateInput)
    await filters.getByLabel('Até', { exact: true }).fill(slot.dateInput)

    const row = page
      .locator('ul[aria-label="Treinos"] > li')
      .filter({ hasText: slot.timeLabel })
      .filter({ hasText: `1/${capacity} alunos` })
    await expect(row).toHaveCount(1)

    await row.locator('button[aria-expanded]').click()
    await expect(
      row.getByRole('list', { name: 'Alunos do treino' }),
    ).toBeVisible()
    await expect(row.getByText(student.name)).toBeVisible()

    // The platform context cannot open /classes nor /evaluations (UX guard).
    await expect(row.getByRole('link', { name: 'Gerenciar aula' })).toHaveCount(
      0,
    )
    await expect(page.getByRole('link', { name: 'Validar faixa' })).toHaveCount(
      0,
    )
  })
})
