import { AppError } from '@/shared/types/app-error'

/**
 * Returns the safe message carried by an AppError (already normalized by the
 * HTTP boundary) or the given fallback for anything else.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof AppError ? error.message : fallback
}
