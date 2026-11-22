/** Local-time helpers shared by class forms, filters and services. */

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toTimeInputValue(iso: string): string {
  const date = new Date(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Combines a local `YYYY-MM-DD` date and `HH:mm` time into an ISO string. */
export function localDateTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

/** Start of the local day as ISO (inclusive lower bound for `from`). */
export function startOfDayIso(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString()
}

/** End of the local day as ISO (inclusive upper bound for `to`). */
export function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString()
}

export function formatClassDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}
