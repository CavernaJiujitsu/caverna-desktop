import { useRef, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { addressLookup, type AddressResult } from '@/shared/lib/address-lookup'
import { MapPreview } from '@/shared/components/map-preview'

export type AddressLocation = {
  address: string
  latitude?: number
  longitude?: number
}

export function AddressLocator({
  value,
  onChange,
  id,
  showMap = false,
}: {
  value: AddressLocation
  onChange: (value: AddressLocation) => void
  id: string
  showMap?: boolean
}) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([])
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [selected, setSelected] = useState(
    Boolean(value.address && value.latitude != null),
  )
  const sequence = useRef(0)

  async function search() {
    if (value.address.trim().length < 5) return
    const current = ++sequence.current
    setPending(true)
    setMessage('')
    setSuggestions([])
    try {
      const results = await addressLookup.search(value.address.trim())
      if (sequence.current !== current) return
      setSuggestions(results)
      if (!results.length)
        setMessage(
          'Nenhum endereço encontrado. Tente outra busca ou informe endereço e coordenadas manualmente.',
        )
    } catch {
      if (sequence.current === current)
        setMessage(
          'Busca indisponível. Use a localização do dispositivo ou informe endereço e coordenadas manualmente.',
        )
    } finally {
      if (sequence.current === current) setPending(false)
    }
  }

  function useDeviceLocation() {
    const deviceRequest = ++sequence.current
    setSuggestions([])
    setMessage('')
    if (!navigator.geolocation) {
      setMessage(
        'Localização indisponível. Informe endereço e coordenadas manualmente.',
      )
      return
    }
    setPending(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (sequence.current !== deviceRequest) return
        const latitude = Number(coords.latitude.toFixed(8))
        const longitude = Number(coords.longitude.toFixed(8))
        const current = ++sequence.current
        setSelected(false)
        onChange({ address: '', latitude, longitude })
        try {
          const result = await addressLookup.reverse(latitude, longitude)
          if (sequence.current !== current) return
          if (result) {
            setSuggestions([{ ...result, latitude, longitude }])
            setMessage('Confira o endereço sugerido antes de selecioná-lo.')
          } else {
            setMessage(
              'Endereço não encontrado. Escreva o endereço; as coordenadas do dispositivo já estão preenchidas.',
            )
          }
        } catch {
          if (sequence.current === current)
            setMessage(
              'Busca indisponível. Escreva o endereço; as coordenadas do dispositivo já estão preenchidas.',
            )
        } finally {
          if (sequence.current === current) setPending(false)
        }
      },
      () => {
        if (sequence.current !== deviceRequest) return
        setPending(false)
        setMessage(
          'Não foi possível obter sua localização. Informe endereço e coordenadas manualmente.',
        )
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  function editAddress(address: string) {
    ++sequence.current
    setSuggestions([])
    setMessage('')
    setPending(false)
    onChange({
      address,
      latitude: selected ? undefined : value.latitude,
      longitude: selected ? undefined : value.longitude,
    })
    setSelected(false)
  }

  return (
    <div className="grid gap-3">
      <div>
        <label
          htmlFor={`${id}-address`}
          className="mb-2 block text-sm font-medium"
        >
          Endereço
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            id={`${id}-address`}
            value={value.address}
            maxLength={500}
            onChange={(event) => editAddress(event.target.value)}
            placeholder="Rua, número, cidade e estado"
            className="min-w-52 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending || value.address.trim().length < 5}
            onClick={() => void search()}
          >
            {pending ? 'Buscando…' : 'Buscar endereço'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={useDeviceLocation}
          >
            Usar localização atual
          </Button>
        </div>
      </div>
      {suggestions.length > 0 && (
        <div
          role="group"
          aria-label="Sugestões de endereço"
          className="grid gap-2"
        >
          <p className="text-sm font-medium">Escolha e confirme o endereço</p>
          {suggestions.map((item, index) => (
            <Button
              key={`${item.address}-${index}`}
              type="button"
              variant="outline"
              className="h-auto whitespace-normal py-2 text-left"
              onClick={() => {
                ++sequence.current
                onChange(item)
                setSelected(true)
                setSuggestions([])
                setMessage(
                  'Endereço selecionado. Confira os dados antes de salvar.',
                )
              }}
            >
              {item.address}
            </Button>
          ))}
        </div>
      )}
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Latitude
          <Input
            aria-label={`${id} latitude`}
            type="number"
            step="any"
            value={value.latitude ?? ''}
            onChange={(event) => {
              ++sequence.current
              setSelected(false)
              setSuggestions([])
              onChange({
                ...value,
                latitude: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Longitude
          <Input
            aria-label={`${id} longitude`}
            type="number"
            step="any"
            value={value.longitude ?? ''}
            onChange={(event) => {
              ++sequence.current
              setSelected(false)
              setSuggestions([])
              onChange({
                ...value,
                longitude: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }}
          />
        </label>
      </div>
      {showMap && (
        <MapPreview latitude={value.latitude} longitude={value.longitude} />
      )}
      <p className="text-xs text-muted-foreground">
        Confirme endereço e coordenadas antes de salvar. Se a busca falhar,
        preencha o endereço e use as coordenadas do dispositivo ou informe ambas
        manualmente.
      </p>
    </div>
  )
}
