import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { BURGHAUSEN_BOUNDS, BURGHAUSEN_CENTER } from './locations'
import { guessIcon, truthIcon } from './leaflet-setup'

type LatLng = { lat: number; lng: number }

type Props = {
  roundKey: string
  guess: LatLng | null
  truth: LatLng | null
  onGuess: (point: LatLng) => void
  revealed: boolean
}

function ClickHandler({ onGuess, disabled }: { onGuess: (p: LatLng) => void; disabled: boolean }) {
  useMapEvents({
    click(e) {
      if (disabled) return
      onGuess({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function FitToReveal({ guess, truth, active }: { guess: LatLng | null; truth: LatLng | null; active: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (!active || !guess || !truth) return
    const bounds = L.latLngBounds([guess.lat, guess.lng], [truth.lat, truth.lng])
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
  }, [active, guess, truth, map])
  return null
}

export function GuessMap({ roundKey, guess, truth, onGuess, revealed }: Props) {
  return (
    <MapContainer
      key={roundKey}
      center={BURGHAUSEN_CENTER}
      zoom={14}
      maxBounds={BURGHAUSEN_BOUNDS}
      maxBoundsViscosity={0.8}
      className="guess-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickHandler onGuess={onGuess} disabled={revealed} />
      {guess && <Marker position={[guess.lat, guess.lng]} icon={guessIcon} />}
      {revealed && truth && <Marker position={[truth.lat, truth.lng]} icon={truthIcon} />}
      {revealed && guess && truth && (
        <Polyline
          positions={[
            [guess.lat, guess.lng],
            [truth.lat, truth.lng],
          ]}
          pathOptions={{ color: '#ff5252', weight: 3, dashArray: '6 6' }}
        />
      )}
      <FitToReveal guess={guess} truth={truth} active={revealed} />
    </MapContainer>
  )
}
