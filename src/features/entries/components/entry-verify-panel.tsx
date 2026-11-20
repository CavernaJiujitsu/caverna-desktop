import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { verifyEntry } from '@/features/entries/services/entry.service'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/lib/error-message'

const codeSchema = z.string().trim().toUpperCase().regex(
  /^CAV-[A-F0-9]{16}$/,
  'Informe o código CAV- seguido de 16 caracteres.',
)

export function EntryVerifyPanel() {
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setMessage('')
    const parsed = codeSchema.safeParse(code)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Código inválido.')
      return
    }
    setPending(true)
    setError('')
    try {
      const result = await verifyEntry(parsed.data)
      setMessage(`Entrada liberada para ${result.studentName}. A presença na aula ainda precisa ser confirmada pelo professor.`)
      setCode('')
    } catch (cause) {
      setError(getErrorMessage(cause, 'Não foi possível conferir o código.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-4" aria-label="Conferir entrada">
      <h2 className="text-lg font-semibold">Entrada na academia</h2>
      <p className="mt-1 text-sm text-muted-foreground">Confira o código do aluno no dia da aula. Isso não registra presença na chamada.</p>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-2 text-sm">
          Código de acesso
          <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="CAV-0000000000000000" autoComplete="off" />
        </label>
        <Button type="submit" disabled={pending}>{pending ? 'Conferindo…' : 'Conferir código'}</Button>
      </form>
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p role="status" className="mt-3 text-sm text-foreground">{message}</p> : null}
    </section>
  )
}
