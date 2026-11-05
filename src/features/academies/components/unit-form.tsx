import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAcademyMutations } from '@/features/academies/hooks/use-academies'
import type { AcademyUnit } from '@/features/academies/schemas/academy.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'

const schema = z.object({ name: z.string().trim().min(1, 'Informe o nome.'), address: z.string().optional(), neighborhood: z.string().optional(), latitude: z.coerce.number().min(-90).max(90), longitude: z.coerce.number().min(-180).max(180) })
type Values = z.infer<typeof schema>
type FormValues = z.input<typeof schema>

export function UnitForm({ caveId, unit, onDone }: { caveId: string; unit?: AcademyUnit; onDone?: () => void }) {
  const form = useForm<FormValues, unknown, Values>({ resolver: zodResolver(schema), defaultValues: { name: unit?.name ?? '', address: unit?.address ?? '', neighborhood: unit?.neighborhood ?? '', latitude: Number(unit?.latitude ?? -23.55052), longitude: Number(unit?.longitude ?? -46.633308) } })
  const mutations = useAcademyMutations()
  async function submit(input: Values) { try { if (unit) await mutations.updateUnit.mutateAsync({ caveId, unitId: unit.id, input }); else await mutations.createUnit.mutateAsync({ caveId, input }); notify.success(unit ? 'Unit updated' : 'Unit added'); form.reset(); onDone?.() } catch { notify.error('Could not save the unit.') } }
  return <form className="grid gap-2 rounded-md border border-dashed p-3" onSubmit={form.handleSubmit(submit)} noValidate><Input aria-label="Unit name" placeholder="Unit name" {...form.register('name')} />{form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}<Input aria-label="Address" placeholder="Address" {...form.register('address')} /><Input aria-label="Neighborhood" placeholder="Neighborhood" {...form.register('neighborhood')} /><div className="grid grid-cols-2 gap-2"><Input aria-label="Latitude" type="number" step="any" {...form.register('latitude')} /><Input aria-label="Longitude" type="number" step="any" {...form.register('longitude')} /></div><Button type="submit" size="sm" disabled={mutations.createUnit.isPending || mutations.updateUnit.isPending}>{unit ? 'Save unit' : 'Add unit'}</Button></form>
}
