import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

const profileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  photoUrl: z.string().url().nullable().optional(),
})

export type Profile = z.infer<typeof profileSchema>

const responseSchema = z.object({
  data: profileSchema,
})

const ENDPOINTS = {
  me: '/profiles/me',
  photo: '/profiles/me/photo',
} as const

export const profileService = {
  async getMe(signal?: AbortSignal): Promise<Profile> {
    try {
      const response = await http.get(ENDPOINTS.me, { signal })
      return responseSchema.parse(response.data).data
    } catch {
      throw new AppError('unknown', 'Falha ao carregar perfil.')
    }
  },

  async updatePhoto(file: File, signal?: AbortSignal): Promise<Profile> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await http.put(ENDPOINTS.photo, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal,
      })
      return responseSchema.parse(response.data).data
    } catch {
      throw new AppError('unknown', 'Falha ao atualizar foto de perfil.')
    }
  },

  async removePhoto(signal?: AbortSignal): Promise<Profile> {
    try {
      const response = await http.delete(ENDPOINTS.photo, { signal })
      return responseSchema.parse(response.data).data
    } catch {
      throw new AppError('unknown', 'Falha ao remover foto de perfil.')
    }
  },
}
