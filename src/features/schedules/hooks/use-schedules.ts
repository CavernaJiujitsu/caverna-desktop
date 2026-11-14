import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { scheduleService } from '@/features/schedules/services/schedule.service'
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
} from '@/features/schedules/schemas/schedule.schema'

export const scheduleKeys = {
  all: ['schedules'] as const,
  list: () => ['schedules', 'list'] as const,
  item: (id: string) => ['schedules', id] as const,
}

export function useSchedules() {
  return useQuery({
    queryKey: scheduleKeys.list(),
    queryFn: ({ signal }) => scheduleService.list(signal),
  })
}

export function useSchedule(id: string) {
  return useQuery({
    queryKey: scheduleKeys.item(id),
    queryFn: ({ signal }) => scheduleService.findOne(id, signal),
    enabled: Boolean(id),
  })
}

export function useScheduleMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: scheduleKeys.all })

  return {
    create: useMutation({
      mutationFn: (input: CreateScheduleInput) => scheduleService.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateScheduleInput }) =>
        scheduleService.update(id, input),
      onSuccess: invalidate,
    }),
    deactivate: useMutation({
      mutationFn: (id: string) => scheduleService.deactivate(id),
      onSuccess: invalidate,
    }),
  }
}
