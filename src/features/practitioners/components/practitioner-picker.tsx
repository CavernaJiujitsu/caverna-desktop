import { useState } from 'react'
import { usePractitionerSearch } from '@/features/practitioners/hooks/use-practitioners'
import type { Practitioner } from '@/features/practitioners/schemas/practitioner.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { getErrorMessage } from '@/shared/lib/error-message'

type PractitionerPickerProps = {
  label?: string
  actionLabel: string
  disabled?: boolean
  onSelect: (practitioner: Practitioner) => void
}

/**
 * Searches students by name or e-mail and hands the chosen one to the parent,
 * so managers never have to type a practitioner UUID.
 */
export function PractitionerPicker({
  label = 'Buscar aluno por nome ou e-mail',
  actionLabel,
  disabled,
  onSelect,
}: PractitionerPickerProps) {
  const [input, setInput] = useState('')
  const search = useDebouncedValue(input.trim())
  const results = usePractitionerSearch(search)

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm font-medium">
        {label}
        <Input
          type="search"
          value={input}
          placeholder="Digite ao menos 2 letras"
          onChange={(event) => setInput(event.target.value)}
        />
      </label>
      {search.length < 2 ? null : results.isPending ? (
        <p className="text-xs text-muted-foreground">Buscando alunos…</p>
      ) : results.isError ? (
        <p role="alert" className="text-xs text-destructive">
          {getErrorMessage(results.error, 'Não foi possível buscar alunos.')}
        </p>
      ) : results.data.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum aluno encontrado.
        </p>
      ) : (
        <ul
          className="max-h-60 divide-y divide-border overflow-y-auto rounded-lg border border-border"
          aria-label="Alunos encontrados"
        >
          {results.data.map((practitioner) => (
            <li
              key={practitioner.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {practitioner.user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {practitioner.user.email}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => {
                  onSelect(practitioner)
                  setInput('')
                }}
              >
                {actionLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
