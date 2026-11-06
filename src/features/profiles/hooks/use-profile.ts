import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  profileService,
  type Profile,
} from '@/features/profiles/services/profile.service'

export const profileKeys = {
  me: ['profile', 'me'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: ({ signal }) => profileService.getMe(signal),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useUpdateProfilePhoto() {
  const queryClient = useQueryClient()
  return useMutation<Profile, Error, File>({
    mutationFn: (file) => profileService.updatePhoto(file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.me }),
  })
}

export function useRemoveProfilePhoto() {
  const queryClient = useQueryClient()
  return useMutation<Profile, Error, void>({
    mutationFn: () => profileService.removePhoto(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.me }),
  })
}
