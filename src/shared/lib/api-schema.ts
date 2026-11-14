import { z } from 'zod'

/**
 * The NestJS API wraps every success response in `{ message, data, timestamp }`.
 * These helpers keep that envelope and the pagination shape in one place.
 */
export function envelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({
    message: z.string().optional(),
    data,
    timestamp: z.string().optional(),
  })
}

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    _meta: z.object({
      page: z.number().int().nonnegative(),
      totalPage: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
    // Links are not rendered by the UI; tolerate partial or missing values.
    _links: z.record(z.string(), z.unknown()).optional(),
  })
}

export const emptyDataSchema = z.null()
