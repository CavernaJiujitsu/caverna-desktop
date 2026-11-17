import { useCaveUnits } from '@/features/academies'
import { usePlatformCaves } from '@/features/platform/hooks/use-platform-caves'
import { useTeacher } from '@/features/teachers/hooks/use-teachers'
import { useSession } from '@/shared/session/session'

export type ScopeUnit = {
  id: string
  name: string
  caveId: string
  caveName: string
}

/** Distinct caves present in a list of scope units, in display order. */
export function cavesOf(units: ScopeUnit[]) {
  const caves = new Map<string, string>()
  units.forEach((unit) => caves.set(unit.caveId, unit.caveName))
  return [...caves].map(([id, name]) => ({ id, name }))
}

/**
 * Units the current management context may act on:
 * - platform: every active unit of every cave;
 * - academy: the active units of the confirmed cave;
 * - teacher: the units the teacher is linked to (GET /teachers/:id).
 * The backend still authorizes every request; this only feeds selectors.
 */
export function useScopeUnits() {
  const { selectedContext, session } = useSession()
  const role = selectedContext?.role
  const caveId = role === 'academy' ? (selectedContext?.caveId ?? '') : ''
  const teacherId = role === 'teacher' ? (session?.teacherId ?? '') : ''

  const caves = usePlatformCaves({ enabled: role === 'platform' })
  const caveUnits = useCaveUnits(caveId)
  const teacher = useTeacher(teacherId)

  if (role === 'platform') {
    const units: ScopeUnit[] = (caves.data ?? []).flatMap((cave) =>
      (cave.units ?? [])
        .filter((unit) => unit.active)
        .map((unit) => ({
          id: unit.id,
          name: unit.name,
          caveId: cave.id,
          caveName: cave.name,
        })),
    )
    return {
      units,
      isPending: caves.isPending,
      isError: caves.isError,
      refetch: caves.refetch,
    }
  }

  if (role === 'teacher') {
    const units: ScopeUnit[] = (teacher.data?.caveUnits ?? []).map((unit) => ({
      id: unit.id,
      name: unit.name,
      caveId: unit.caveId,
      caveName: unit.caveName ?? '',
    }))
    return {
      units,
      isPending: Boolean(teacherId) && teacher.isPending,
      isError: !teacherId || teacher.isError,
      refetch: teacher.refetch,
    }
  }

  const units: ScopeUnit[] = (caveUnits.data ?? [])
    .filter((unit) => unit.active !== false)
    .map((unit) => ({
      id: unit.id,
      name: unit.name,
      caveId,
      caveName: selectedContext?.label ?? '',
    }))
  return {
    units,
    isPending: Boolean(caveId) && caveUnits.isPending,
    isError: !caveId || caveUnits.isError,
    refetch: caveUnits.refetch,
  }
}
