import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .url()
    .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol))
    .default('http://localhost:3000'),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
})

export const env = envSchema.parse(import.meta.env)
