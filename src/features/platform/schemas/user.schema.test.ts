import { describe, expect, it } from 'vitest'
import {
  accessLockReason,
  grantableRoles,
  toGrantAccessInput,
  userAccessSchema,
} from '@/features/platform/schemas/user.schema'

// `data` of GET /platform/users/:id/access, copied from the local API (17/11).
const teacherAccess = {
  userId: '074d6761-8879-4aa3-a35a-22a0b8d070df',
  name: 'Gustavo Araújo',
  email: 'prof.santana.mandaqui.2@caverna.com',
  primaryRole: 'TEACHER',
  roles: ['TEACHER'],
  isRoot: false,
  practitionerId: null,
  caveAdmin: null,
  teacher: {
    id: '9422db4e-9ac9-4e6a-872a-61145cd78033',
    caveUnits: [
      {
        id: '3e29dab0-d3f3-4dd0-a23e-9feb42b839fd',
        name: 'Mandaqui',
        caveId: 'd53d48a9-3b9a-4589-b7d6-e0166f4094b6',
      },
    ],
  },
}

const admin = { userId: 'actor', roles: ['ADMIN' as const] }
const root = { userId: 'actor', roles: ['ADMIN' as const, 'ROOT' as const] }

describe('access ladder', () => {
  it('locks root, yourself and admins for a non-root actor', () => {
    expect(
      accessLockReason(root, {
        userId: 'x',
        roles: ['ADMIN', 'ROOT'],
        isRoot: true,
      }),
    ).not.toBeNull()
    expect(
      accessLockReason(admin, { userId: 'actor', roles: ['TEACHER'] }),
    ).not.toBeNull()
    expect(
      accessLockReason(admin, { userId: 'x', roles: ['ADMIN'] }),
    ).not.toBeNull()
  })

  it('lets root manage admins and admins manage lower roles', () => {
    expect(accessLockReason(root, { userId: 'x', roles: ['ADMIN'] })).toBeNull()
    expect(
      accessLockReason(admin, { userId: 'x', roles: ['CAVE_ADMIN'] }),
    ).toBeNull()
  })

  it('offers ADMIN only to root', () => {
    expect(grantableRoles(false)).not.toContain('ADMIN')
    expect(grantableRoles(true)).toContain('ADMIN')
  })

  it('sends only the scope the role needs', () => {
    expect(
      toGrantAccessInput({
        role: 'CAVE_ADMIN',
        caveId: 'c1',
        caveUnitIds: ['u1'],
      }),
    ).toEqual({ role: 'CAVE_ADMIN', caveId: 'c1' })
    expect(
      toGrantAccessInput({
        role: 'TEACHER',
        caveId: 'c1',
        caveUnitIds: ['u1'],
      }),
    ).toEqual({ role: 'TEACHER', caveUnitIds: ['u1'] })
    expect(
      toGrantAccessInput({ role: 'ADMIN', caveId: 'c1', caveUnitIds: [] }),
    ).toEqual({ role: 'ADMIN' })
  })
})

describe('userAccessSchema', () => {
  it('accepts the access view returned by the API', () => {
    expect(userAccessSchema.parse(teacherAccess)).toEqual(teacherAccess)
  })

  it('accepts a teacher unit without cave, typed nullable by the access DTO', () => {
    const unitWithoutCave = {
      ...teacherAccess,
      teacher: {
        ...teacherAccess.teacher,
        caveUnits: [{ ...teacherAccess.teacher.caveUnits[0], caveId: null }],
      },
    }

    expect(
      userAccessSchema.parse(unitWithoutCave).teacher?.caveUnits[0]?.caveId,
    ).toBeNull()
  })
})
