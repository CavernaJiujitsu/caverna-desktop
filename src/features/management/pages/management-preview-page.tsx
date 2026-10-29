import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ContextSelection } from '@/features/management/components/context-selection'
import { ContextWorkspacePreview } from '@/features/management/components/context-workspace-preview'
import { ManagementShell } from '@/features/management/components/management-shell'
import type { ManagementContext } from '@/features/management/types/management-context'

// Local preview data only. This is never interpreted as an authorized API response.
const previewContexts: ManagementContext[] = [
  {
    id: 'preview-academy',
    role: 'academy',
    label: 'Academia (exemplo)',
    detail: 'Academia de exemplo · todas as unidades',
  },
  {
    id: 'preview-teacher',
    role: 'teacher',
    label: 'Professor (exemplo)',
    detail: 'Professor de exemplo · unidade ilustrativa',
  },
  {
    id: 'preview-platform',
    role: 'platform',
    label: 'Plataforma (exemplo)',
    detail: 'Operação global ilustrativa',
  },
]

type PreviewState = 'success' | 'loading' | 'empty' | 'error'

export default function ManagementPreviewPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<PreviewState>('success')
  const [selected, setSelected] = useState<ManagementContext | null>(null)

  return (
    <ManagementShell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-sm">
        <p>
          <strong>Prévia local:</strong> exemplos ilustrativos, sem sessão ou
          dados da API.
        </p>
        <label className="flex items-center gap-2">
          Estado
          <select
            className="rounded-md border bg-background px-3 py-2"
            value={state}
            onChange={(event) => {
              setState(event.target.value as PreviewState)
              setSelected(null)
            }}
          >
            <option value="success">Contextos</option>
            <option value="loading">Carregando</option>
            <option value="empty">Vazio</option>
            <option value="error">Erro</option>
          </select>
        </label>
      </div>
      {selected ? (
        <ContextWorkspacePreview
          context={selected}
          onSwitch={() => setSelected(null)}
          onExit={() => navigate(routes.login)}
        />
      ) : (
        <ContextSelection
          contexts={state === 'success' ? previewContexts : []}
          status={
            state === 'loading'
              ? 'loading'
              : state === 'error'
                ? 'error'
                : 'success'
          }
          onSelect={setSelected}
          onRetry={() => setState('success')}
        />
      )}
    </ManagementShell>
  )
}
