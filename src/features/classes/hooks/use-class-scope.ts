import { useScopeUnits } from '@/features/management/hooks/use-scope-units'
import { TEACHER_NAME_FALLBACK } from '@/features/classes/schemas/class.schema'
import { useTeacherOptions } from '@/features/teachers/hooks/use-teachers'
import { useSession } from '@/shared/session/session'

export type ClassTeacherOption = {
  id: string
  name: string
  unitIds: string[]
}

/**
 * Resolves what the current context may see and edit on the classes page:
 * academy contexts work with the cave units and its teachers, while teacher
 * contexts are pinned to the logged teacher and its linked units.
 */
export function useClassScope() {
  const { selectedContext, session } = useSession()
  const isTeacher = selectedContext?.role === 'teacher'
  const caveId =
    selectedContext?.role === 'academy' ? (selectedContext.caveId ?? '') : ''
  const ownTeacherId = isTeacher ? (session?.teacherId ?? '') : ''
  const scopeUnits = useScopeUnits()
  const loadsTeachers = !isTeacher && Boolean(caveId)
  const teachersQuery = useTeacherOptions(caveId, loadsTeachers)

  const teachers: ClassTeacherOption[] = isTeacher
    ? ownTeacherId
      ? [
          {
            id: ownTeacherId,
            name: session?.user.name ?? 'Você',
            unitIds: scopeUnits.units.map((unit) => unit.id),
          },
        ]
      : []
    : (teachersQuery.data ?? []).map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        unitIds: (teacher.caveUnits ?? []).map((unit) => unit.id),
      }))

  function teacherName(teacherId: string, embedded: string | null) {
    if (embedded) return embedded
    if (isTeacher && teacherId === ownTeacherId) return 'Você'
    return (
      teachers.find((teacher) => teacher.id === teacherId)?.name ??
      TEACHER_NAME_FALLBACK
    )
  }

  const unitsError = scopeUnits.isError
  const teachersError = loadsTeachers && teachersQuery.isError

  /** Refetches only the catalogs (units, teachers) that failed. */
  function retryCatalogs() {
    if (unitsError) void scopeUnits.refetch()
    if (teachersError) void teachersQuery.refetch()
  }

  return {
    isTeacher,
    caveId,
    ownTeacherId,
    units: scopeUnits.units,
    unitsPending: scopeUnits.isPending,
    unitsError,
    teachers,
    teachersPending: loadsTeachers && teachersQuery.isPending,
    teachersError,
    retryCatalogs,
    teacherName,
  }
}

export type ClassScope = ReturnType<typeof useClassScope>
