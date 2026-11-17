import { describe, expect, it } from 'vitest'
import { canOpenRoute, routeContextRoles } from '@/app/router/routes'

describe('canOpenRoute', () => {
  it('allows class and evaluation pages only to academy and teacher contexts', () => {
    expect(canOpenRoute('classes', 'academy')).toBe(true)
    expect(canOpenRoute('classes', 'teacher')).toBe(true)
    expect(canOpenRoute('classes', 'platform')).toBe(false)
    expect(canOpenRoute('evaluations', 'academy')).toBe(true)
    expect(canOpenRoute('evaluations', 'platform')).toBe(false)
  })

  it('keeps trainings and memberships for platform and academy contexts', () => {
    expect(routeContextRoles.trainings).toEqual(['platform', 'academy'])
    expect(routeContextRoles.memberships).toEqual(['platform', 'academy'])
    expect(canOpenRoute('trainings', 'teacher')).toBe(false)
  })

  it('denies when no context is selected', () => {
    expect(canOpenRoute('classes', null)).toBe(false)
    expect(canOpenRoute('classes', undefined)).toBe(false)
  })
})
