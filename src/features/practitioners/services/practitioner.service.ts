import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'
import {
  practitionerSchema,
  type Practitioner,
  type PractitionerInput,
  type PractitionerUpdateInput,
} from '@/features/practitioners/schemas/practitioner.schema'
import {
  trailResponseSchema,
  homeResponseSchema,
  type Trail,
  type Home,
  type NoActiveBelt,
} from '@/features/practitioners/schemas/trail.schema'

const ENDPOINTS = {
  list: '/practitioners',
  item: (id: string) => `/practitioners/${id}`,
  trail: '/practitioners/me/trail',
  home: (id: string) => `/practitioners/${id}/home`,
} as const

const listResponseSchema = z.object({
  data: z.object({
    data: z.array(practitionerSchema),
    _meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
    }),
  }),
})

const itemResponseSchema = z.object({
  data: practitionerSchema,
})

export const practitionerService = {
  async list(signal?: AbortSignal): Promise<Practitioner[]> {
    try {
      const response = await http.get(ENDPOINTS.list, {
        params: { page: 1, limit: 100 },
        signal,
      })
      return listResponseSchema.parse(response.data).data.data
    } catch {
      throw new AppError('unknown', 'Falha ao listar alunos.')
    }
  },

  async findOne(id: string, signal?: AbortSignal): Promise<Practitioner> {
    try {
      const response = await http.get(ENDPOINTS.item(id), { signal })
      return itemResponseSchema.parse(response.data).data
    } catch {
      throw new AppError('not-found', 'Aluno não encontrado.')
    }
  },

  async create(input: PractitionerInput): Promise<Practitioner> {
    try {
      const response = await http.post(ENDPOINTS.list, {
        user: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
        ...(input.age !== undefined ? { age: input.age } : {}),
        ...(input.latitude !== undefined && input.longitude !== undefined
          ? {
              coordinates: {
                latitude: input.latitude,
                longitude: input.longitude,
              },
            }
          : {}),
      })
      return itemResponseSchema.parse(response.data).data
    } catch {
      throw new AppError('unknown', 'Falha ao criar aluno.')
    }
  },

  async update(
    id: string,
    input: PractitionerUpdateInput,
  ): Promise<Practitioner> {
    try {
      const response = await http.patch(ENDPOINTS.item(id), {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.age !== undefined ? { age: input.age } : {}),
        ...(input.latitude !== undefined && input.longitude !== undefined
          ? { latitude: input.latitude, longitude: input.longitude }
          : {}),
      })
      return itemResponseSchema.parse(response.data).data
    } catch {
      throw new AppError('unknown', 'Falha ao atualizar aluno.')
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await http.delete(ENDPOINTS.item(id))
    } catch {
      throw new AppError('unknown', 'Falha ao remover aluno.')
    }
  },

  async getMyTrail(signal?: AbortSignal): Promise<Trail | NoActiveBelt> {
    try {
      const response = await http.get(ENDPOINTS.trail, { signal })
      return trailResponseSchema.parse(response.data).data
    } catch {
      throw new AppError('unknown', 'Falha ao carregar trilha do aluno.')
    }
  },

  async getHome(id: string, signal?: AbortSignal): Promise<Home> {
    try {
      const response = await http.get(ENDPOINTS.home(id), { signal })
      return homeResponseSchema.parse(response.data).data
    } catch {
      throw new AppError('unknown', 'Falha ao carregar tela inicial do aluno.')
    }
  },
}
