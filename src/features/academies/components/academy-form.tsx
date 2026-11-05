import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  academyInputSchema,
  type AcademyInput,
  type Academy,
} from '@/features/academies/schemas/academy.schema'
import { useAcademyMutations, useCreateAcademy } from '@/features/academies/hooks/use-academies'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'

export function AcademyForm({ academy, onDone }: { academy?: Academy; onDone?: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcademyInput>({
    resolver: zodResolver(academyInputSchema),
    defaultValues: { name: academy?.name ?? '' },
  })
  const createAcademy = useCreateAcademy()
  const mutations = useAcademyMutations()

  async function onSubmit(values: AcademyInput) {
    try {
      if (academy) await mutations.update.mutateAsync({ id: academy.id, input: values })
      else await createAcademy.mutateAsync(values)
      reset()
      notify.success(academy ? 'Academy updated' : 'Academy added')
      onDone?.()
    } catch {
      notify.error('Could not add the academy. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <label htmlFor="academy-name" className="block text-sm font-medium">
        Academy name
      </label>
      <Input
        id="academy-name"
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? 'academy-name-error' : undefined}
        {...register('name')}
      />
      {errors.name && (
        <p
          id="academy-name-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {errors.name.message}
        </p>
      )}
      <Button type="submit" disabled={createAcademy.isPending || mutations.update.isPending}>
        {createAcademy.isPending || mutations.update.isPending ? 'Saving…' : academy ? 'Save academy' : 'Add academy'}
      </Button>
    </form>
  )
}
