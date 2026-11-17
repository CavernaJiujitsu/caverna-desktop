import { LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Carregando' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 py-6 text-muted-foreground"
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}
