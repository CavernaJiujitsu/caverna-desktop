import { z } from 'zod'

const uuid = z.string().uuid('Informe um UUID válido.')

export const studentMembershipSchema = z
  .object({
    id: uuid,
    active: z.boolean().optional(),
    joinedAt: z.string().optional(),
    practitioner: z
      .object({
        id: uuid,
        user: z
          .object({
            id: uuid,
            name: z.string(),
            email: z.email(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough()

export type StudentMembership = z.infer<typeof studentMembershipSchema>
