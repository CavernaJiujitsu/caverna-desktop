import { useEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

function MapCanvas({ latitude, longitude }: { latitude: number; longitude: number }) {
  const host = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const marker = useRef<Marker | null>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!host.current) return
    let alive = true
    let instance: MapLibreMap | undefined
    import('maplibre-gl').then(({ Map, setWorkerUrl }) => {
      if (!alive || !host.current) return
      setWorkerUrl('/maplibre-gl-worker.mjs')
      instance = new Map({
        container: host.current,
        style: STYLE_URL,
        center: [-51, -14],
        zoom: 3,
      })
      instance.on('error', () => setFailed(true))
      map.current = instance
      setReady(true)
    }).catch(() => { if (alive) setFailed(true) })
    return () => {
      alive = false
      marker.current?.remove()
      instance?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current) return
    let alive = true
    import('maplibre-gl').then(({ Marker }) => {
      if (!alive || !map.current) return
      marker.current?.remove()
      marker.current = new Marker({ color: '#FF6B35' }).setLngLat([longitude, latitude]).addTo(map.current)
      map.current.flyTo({ center: [longitude, latitude], zoom: 14 })
    }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [ready, latitude, longitude])

  return <div className="space-y-1">
    <div ref={host} className="h-48 overflow-hidden rounded-xl border border-border bg-card" role="img" aria-label="Mapa de prévia da localização da unidade" />
    {failed && <p role="status" className="text-xs text-muted-foreground">Mapa indisponível. Você ainda pode salvar o endereço e as coordenadas.</p>}
  </div>
}

export function MapPreview({ latitude, longitude }: { latitude?: number; longitude?: number }) {
  if (latitude === undefined || longitude === undefined ||
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 ||
      (latitude === 0 && longitude === 0)) {
    return <p className="text-xs text-muted-foreground">Escolha um endereço para ver sua localização no mapa.</p>
  }
  return <MapCanvas latitude={latitude} longitude={longitude} />
}
