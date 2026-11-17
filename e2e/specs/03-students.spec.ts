import { expect, test } from '@playwright/test'
import { createPractitioner } from '../support/api'
import { ACCOUNTS, signInAs } from '../support/auth'

/**
 * Journey 3: the platform context lists every student without a cave filter
 * and narrows the same list by name and e-mail.
 */
test.describe('jornada 3: alunos', () => {
  test('plataforma consulta a lista geral e busca por nome e e-mail', async ({
    page,
    request,
  }) => {
    const student = await createPractitioner(request, 'alunos')

    await signInAs(page, 'platform', {
      label: 'Administração da plataforma',
      role: 'Plataforma',
    })
    await page.getByRole('link', { name: 'Alunos' }).click()
    await expect(page).toHaveURL(/\/memberships$/)

    // No cave and no unit selected: the general list is rendered.
    await expect(
      page.getByRole('combobox', { name: 'Caverna', exact: true }),
    ).toHaveValue('')
    await expect(
      page.getByRole('list', { name: 'Lista de alunos' }),
    ).toBeVisible()
    await expect(page.getByText(/\d+ aluno\(s\)/)).toBeVisible()

    const search = page.getByRole('searchbox', { name: 'Buscar aluno' })
    await search.fill(student.name)
    const byName = page
      .getByRole('list', { name: 'Lista de alunos' })
      .getByRole('listitem')
      .filter({ hasText: student.email })
    await expect(byName).toHaveCount(1)
    await expect(byName.getByText(student.name)).toBeVisible()

    await search.fill(student.email)
    // The URL is unchanged: the search runs inside /memberships.
    await expect(page).toHaveURL(/\/memberships$/)
    const byEmail = page
      .getByRole('list', { name: 'Lista de alunos' })
      .getByRole('listitem')
      .filter({ hasText: student.name })
    await expect(byEmail).toHaveCount(1)
    await expect(byEmail.getByText(student.email)).toBeVisible()
  })
})
