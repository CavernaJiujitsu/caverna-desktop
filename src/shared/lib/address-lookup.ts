import { z } from 'zod'
import { envelopeSchema } from '@/shared/lib/api-schema'
import { http, normalizeHttpError } from '@/shared/lib/axios'

const addressResultSchema = z.object({
  address: z.string().min(1).max(500),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
})

export type AddressResult = z.infer<typeof addressResultSchema>

export const addressLookup = {
  async search(q: string): Promise<AddressResult[]> {
    try {
      const { data } = await http.get<unknown>(
        '/practitioners/addresses/search',
        {
          params: { q },
        },
      )
      return envelopeSchema(z.array(addressResultSchema)).parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
  async reverse(
    latitude: number,
    longitude: number,
  ): Promise<AddressResult | null> {
    try {
      const { data } = await http.get<unknown>(
        '/practitioners/addresses/reverse',
        {
          params: { latitude, longitude },
        },
      )
      return envelopeSchema(addressResultSchema.nullable()).parse(data).data
    } catch (error) {
      throw normalizeHttpError(error)
    }
  },
}
