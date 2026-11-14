export type ManagementRole = 'platform' | 'academy' | 'teacher'

export type ManagementContext = {
  id: string
  role: ManagementRole
  label: string
  detail: string
  /** Cave scope returned for an academy management context. */
  caveId?: string
}
