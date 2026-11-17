import { expect, test } from '@playwright/test'
import {
  createClass,
  createPractitioner,
  discoverClassScope,
  enroll,
  futureSlot,
  getEnrollmentStatus,
  loginApi,
  uniqueCapacity,
} from '../support/api'
import { ACCOUNTS, signInAs } from '../support/auth'

/**
 * Journey 4: a student enrolled through the API appears in the teacher's
 * attendance panel, and the teacher confirms the check-in there.
 */
test.describe('jornada 4: chamada do professor', () => {
  test('professor abre a chamada e confirma a presença de um aluno inscrito', async ({
    page,
    request,
  }) => {
    const adminToken = await loginApi(request, ACCOUNTS.platform)
    const teacherToken = await loginApi(request, ACCOUNTS.teacher)
    const scope = await discoverClassScope(request, adminToken)
    const student = await createPractitioner(request, 'chamada')
    const slot = futureSlot(3, 2)
    const capacity = uniqueCapacity(3)
    const classId = await createClass(
      request,
      adminToken,
      scope,
      slot,
      capacity,
    )
    await enroll(request, adminToken, classId, student.id)

    await signInAs(page, 'teacher', {
      label: 'Mestre Semente',
      role: 'Professor',
    })
    await page.getByRole('link', { name: 'Minhas aulas' }).click()
    await expect(page).toHaveURL(/\/classes$/)
    const filters = page.getByRole('region', { name: 'Filtros de aulas' })
    await expect(filters).toBeVisible()
    await filters
      .getByRole('combobox', { name: 'Unidade', exact: true })
      .selectOption({ label: 'Centro' })

    await filters.getByLabel('De', { exact: true }).fill(slot.dateInput)
    await filters.getByLabel('Até', { exact: true }).fill(slot.dateInput)

    const row = page
      .locator('ul[aria-label="Aulas"] > li')
      .filter({ hasText: slot.timeLabel })
      .filter({ hasText: `${capacity} vagas` })
    await expect(row).toHaveCount(1)
    await row.getByRole('button', { name: 'Chamada' }).click()

    const panel = page.locator('section[aria-labelledby="attendance-title"]')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('Chamada', { exact: true })).toBeVisible()

    const item = panel
      .getByRole('list', { name: 'Lista de inscritos' })
      .getByRole('listitem')
      .filter({ hasText: student.name })
    await expect(item).toHaveCount(1)
    await expect(item.getByText('Inscrito')).toBeVisible()

    await item.getByRole('button', { name: 'Check-in' }).click()
    await expect(item.getByText('Presença confirmada')).toBeVisible()
    await expect(
      item.getByRole('button', { name: 'Registrar participação' }),
    ).toBeVisible()

    await expect
      .poll(() =>
        getEnrollmentStatus(request, teacherToken, classId, student.id),
      )
      .toBe('CONFIRMED')
  })
})
