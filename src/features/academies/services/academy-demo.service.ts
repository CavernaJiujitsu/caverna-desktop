import {
  academySchema,
  type Academy,
  type AcademyInput,
} from '@/features/academies/schemas/academy.schema'
import { AppError } from '@/shared/types/app-error'

// In-memory demo adapter. It does not call or represent a Caverna API endpoint.
let academies: Academy[] = []

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new AppError('cancelled', 'Request cancelled.')
}

export const academyDemoService = {
  async list(signal?: AbortSignal): Promise<Academy[]> {
    assertNotAborted(signal)
    return academies.map((item) => academySchema.parse(item))
  },
  async create(input: AcademyInput, signal?: AbortSignal): Promise<Academy> {
    assertNotAborted(signal)
    const academy = academySchema.parse({ ...input, id: crypto.randomUUID() })
    academies = [...academies, academy]
    return academy
  },
}
