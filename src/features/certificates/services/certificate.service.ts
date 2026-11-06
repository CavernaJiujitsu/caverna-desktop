import { z } from 'zod'
import { http } from '@/shared/lib/axios'
import { AppError } from '@/shared/types/app-error'

const certificateSchema = z.object({
  id: z.string().uuid(),
  originalName: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  mimeType: z.string(),
  url: z.string().url().optional(),
  createdAt: z.string().optional(),
})

export type Certificate = z.infer<typeof certificateSchema>

export type CertificateUploadInput = {
  file: File
}

const listResponseSchema = z.object({
  data: z.object({
    data: z.array(certificateSchema),
    _meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
    }),
  }),
})

const itemResponseSchema = z.object({
  data: certificateSchema,
})

const ENDPOINTS = {
  upload: '/certificates/upload',
  list: '/certificates',
} as const

export const certificateService = {
  async upload(input: CertificateUploadInput, signal?: AbortSignal) {
    try {
      const formData = new FormData()
      formData.append('file', input.file)
      const response = await http.post(ENDPOINTS.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal,
      })
      return itemResponseSchema.parse(response.data).data
    } catch {
      throw new AppError('unknown', 'Falha ao enviar certificado.')
    }
  },

  async list(signal?: AbortSignal): Promise<Certificate[]> {
    try {
      const response = await http.get(ENDPOINTS.list, {
        params: { page: 1, limit: 100 },
        signal,
      })
      return listResponseSchema.parse(response.data).data.data
    } catch {
      throw new AppError('unknown', 'Falha ao listar certificados.')
    }
  },
}
