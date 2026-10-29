import { toast } from 'sonner'

type Options = { description?: string; id?: string }
const duration = 4500

export const notify = {
  success: (message: string, options?: Options) =>
    toast.success(message, {
      ...options,
      duration,
      id: options?.id ?? message,
    }),
  error: (message: string, options?: Options) =>
    toast.error(message, {
      ...options,
      duration: 6000,
      id: options?.id ?? message,
    }),
  warning: (message: string, options?: Options) =>
    toast.warning(message, {
      ...options,
      duration,
      id: options?.id ?? message,
    }),
  info: (message: string, options?: Options) =>
    toast.info(message, { ...options, duration, id: options?.id ?? message }),
}
