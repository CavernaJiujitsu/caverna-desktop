import { expect, test } from '@playwright/test'
import {
  checkIn,
  createClass,
  createPractitioner,
  createScheduledValidation,
  discoverClassScope,
  enroll,
  futureSlot,
  getValidationStatus,
  loginApi,
  uniqueCapacity,
} from '../support/api'
import { ACCOUNTS, signInAs } from '../support/auth'

/**
 * Journey 5: a scheduled validation whose student already checked in is
 * approved by the class teacher from the queue.
 */
test.describe('jornada 5: aprovação de validação', () => {
  test('professor aprova uma validação agendada com presença confirmada', async ({
    page,
    request,
  }) => {
    const adminToken = await loginApi(request, ACCOUNTS.platform)
    const teacherToken = await loginApi(request, ACCOUNTS.teacher)
    const scope = await discoverClassScope(request, adminToken)
    const student = await createPractitioner(request, 'validacao')
    const slot = futureSlot(3, 3)
    const capacity = uniqueCapacity(4)
    const classId = await createClass(
      request,
      adminToken,
      scope,
      slot,
      capacity,
    )
    const enrollmentId = await enroll(request, adminToken, classId, student.id)
    await checkIn(request, teacherToken, classId, enrollmentId)
    const validationId = await createScheduledValidation(
      request,
      adminToken,
      student.id,
      classId,
    )

    await signInAs(page, 'teacher', {
      label: 'Mestre Semente',
      role: 'Professor',
    })
    await page.getByRole('link', { name: 'Validações' }).click()
    await expect(page).toHaveURL(/\/evaluations$/)
    const filters = page.getByRole('region', { name: 'Filtros da fila' })
    await expect(filters).toBeVisible()

    // The teacher's queue opens on SCHEDULED validations.
    await expect(
      filters.getByRole('combobox', { name: 'Situação', exact: true }),
    ).toHaveValue('SCHEDULED')
    await filters
      .getByRole('textbox', { name: 'Data da aula (opcional)' })
      .fill(slot.dateInput)

    const card = page.locator('article').filter({ hasText: student.name })
    await expect(card).toHaveCount(1)
    await expect(card.getByText('Agendada')).toBeVisible()
    await expect(
      card.getByText('Requer check-in do aluno na aula.'),
    ).toBeVisible()

    await card.getByRole('button', { name: 'Aprovar' }).click()
    await card.getByRole('button', { name: 'Confirmar aprovação' }).click()
    await expect(page.getByText('Faixa aprovada.')).toBeVisible()

    await expect
      .poll(() => getValidationStatus(request, teacherToken, validationId))
      .toBe('APPROVED')

    // The card leaves the SCHEDULED queue after the invalidation.
    await expect(card).toHaveCount(0)
  })
})
