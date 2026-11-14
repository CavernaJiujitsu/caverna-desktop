import { describe, expect, it } from 'vitest'
import { createCaveAdminSchema } from '@/features/platform/schemas/cave.schema'

describe('createCaveAdminSchema', () => {
  it('requires a password with at least 8 characters for a new account', () => {
    const result = createCaveAdminSchema.safeParse({
      name: 'Maria Souza',
      email: 'maria@example.com',
      password: 'curta',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['password'] }),
      )
    }
  })

  it('accepts only a UUID when linking an existing account', () => {
    expect(
      createCaveAdminSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
    ).toBe(true)
    expect(
      createCaveAdminSchema.safeParse({ userId: 'not-an-id' }).success,
    ).toBe(false)
  })
})
