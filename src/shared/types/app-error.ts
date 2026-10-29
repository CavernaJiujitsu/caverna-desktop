export type AppErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'server'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'unknown'

export class AppError extends Error {
  constructor(
    public readonly kind: AppErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
