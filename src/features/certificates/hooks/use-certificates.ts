import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  certificateService,
  type Certificate,
  type CertificateUploadInput,
} from '@/features/certificates/services/certificate.service'

export const certificateKeys = {
  all: ['certificates'] as const,
  list: () => ['certificates', 'list'] as const,
}

export function useCertificates() {
  return useQuery({
    queryKey: certificateKeys.list(),
    queryFn: ({ signal }) => certificateService.list(signal),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useUploadCertificate() {
  const queryClient = useQueryClient()
  return useMutation<Certificate, Error, CertificateUploadInput>({
    mutationFn: (input) => certificateService.upload(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
  })
}
