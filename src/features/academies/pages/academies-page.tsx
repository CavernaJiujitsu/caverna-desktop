import { useState } from 'react'
import { AcademyForm } from '@/features/academies/components/academy-form'
import { UnitForm } from '@/features/academies/components/unit-form'
import {
  useAcademies,
  useAcademyMutations,
} from '@/features/academies/hooks/use-academies'
import { ManagementShell } from '@/features/management/components/management-shell'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { ErrorState } from '@/shared/components/feedback/error-state'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { PageHeader } from '@/shared/components/layout/page-header'

export default function AcademiesPage() {
  const academies = useAcademies()
  const mutations = useAcademyMutations()
  const [editingAcademy, setEditingAcademy] = useState<string | null>(null)
  const [addingUnitTo, setAddingUnitTo] = useState<string | null>(null)
  const [editingUnit, setEditingUnit] = useState<string | null>(null)

  return (
    <ManagementShell>
      <PageHeader
        title="Academies"
        description="Cadastre e consulte cavernas pela API do Caverna."
      />
      <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-medium">Add an academy</h2>
          <AcademyForm />
        </section>
        <section aria-label="Academy list">
          {academies.isPending ? (
            <LoadingState label="Loading academies" />
          ) : academies.isError ? (
            <ErrorState
              message="Could not load academies."
              onRetry={() => void academies.refetch()}
            />
          ) : academies.data.length === 0 ? (
            <EmptyState
              title="No academies yet"
              description="Add one using the form."
            />
          ) : (
            <ul className="space-y-3">
              {academies.data.map((academy) => (
                <li className="rounded-lg border p-4" key={academy.id}>
                  {editingAcademy === academy.id ? (
                    <AcademyForm
                      academy={academy}
                      onDone={() => setEditingAcademy(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <strong>{academy.name}</strong>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-sm underline"
                          onClick={() => setEditingAcademy(academy.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm text-destructive underline"
                          disabled={mutations.remove.isPending}
                          onClick={() => {
                            if (window.confirm('Remove this academy?'))
                              mutations.remove.mutate(academy.id)
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-medium">Units</h3>
                    {academy.units.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No units registered.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {academy.units.map((unit) => (
                          <li
                            className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                            key={unit.id}
                          >
                            <span>
                              {unit.name}
                              {unit.neighborhood
                                ? ` · ${unit.neighborhood}`
                                : ''}
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="underline"
                                onClick={() => setEditingUnit(unit.id)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-destructive underline"
                                disabled={mutations.removeUnit.isPending}
                                onClick={() => {
                                  if (window.confirm('Remove this unit?'))
                                    mutations.removeUnit.mutate({
                                      caveId: academy.id,
                                      unitId: unit.id,
                                    })
                                }}
                              >
                                Remove
                              </button>
                            </div>
                            {editingUnit === unit.id ? (
                              <UnitForm
                                caveId={academy.id}
                                unit={unit}
                                onDone={() => setEditingUnit(null)}
                              />
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                    {addingUnitTo === academy.id ? (
                      <UnitForm
                        caveId={academy.id}
                        onDone={() => setAddingUnitTo(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        className="text-sm underline"
                        onClick={() => setAddingUnitTo(academy.id)}
                      >
                        Add unit
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ManagementShell>
  )
}
