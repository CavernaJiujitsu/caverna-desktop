import { ROLE_LABELS, type UserRole } from '@/shared/types/user-role'

const ROLE_ORDER: UserRole[] = [
  'ROOT',
  'ADMIN',
  'CAVE_ADMIN',
  'TEACHER',
  'STUDENT',
]

export function RoleBadges({ roles }: { roles: UserRole[] }) {
  const sorted = ROLE_ORDER.filter((role) => roles.includes(role))
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Perfis">
      {sorted.map((role) => (
        <li
          key={role}
          className={
            role === 'ROOT'
              ? 'rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground'
              : 'rounded-full bg-accent px-2 py-0.5 text-xs font-medium'
          }
        >
          {ROLE_LABELS[role]}
        </li>
      ))}
    </ul>
  )
}
