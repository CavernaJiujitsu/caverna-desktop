import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  academyInputSchema,
  type AcademyInput,
} from '@/features/academies/schemas/academy.schema'
import { useCreateAcademy } from '@/features/academies/hooks/use-academies'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { notify } from '@/shared/lib/notifications'

export function AcademyForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcademyInput>({
    resolver: zodResolver(academyInputSchema),
    defaultValues: { name: '' },
  })
  const createAcademy = useCreateAcademy()

  async function onSubmit(values: AcademyInput) {
    try {
      await createAcademy.mutateAsync(values)
      reset()
      notify.success('Demo academy added')
    } catch {
      notify.error('Could not add the demo academy. Please try again.')
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
      <Button type="submit" disabled={createAcademy.isPending}>
        {createAcademy.isPending ? 'Adding…' : 'Add demo academy'}
      </Button>
    </form>
  )
}
