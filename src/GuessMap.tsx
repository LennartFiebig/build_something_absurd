import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { BURGHAUSEN_BOUNDS, BURGHAUSEN_CENTER } from './locations'
import { guessIcon, otherGuessIcon, truthIcon } from './leaflet-setup'

type LatLng = { lat: number; lng: number }

type ExtraGuess = { point: LatLng; label: string }

type Props = {
  roundKey: string
  guess: LatLng | null
  truth: LatLng | null
  onGuess: (point: LatLng) => void
  revealed: boolean
  extraGuesses?: ExtraGuess[]
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

function FitToReveal({
  guess,
  truth,
  extras,
  active,
}: {
  guess: LatLng | null
  truth: LatLng | null
  extras: ExtraGuess[]
  active: boolean
}) {
  const map = useMap()
  useEffect(() => {
    if (!active || !truth) return
    const points: [number, number][] = []
    if (guess) points.push([guess.lat, guess.lng])
    points.push([truth.lat, truth.lng])
    for (const g of extras) points.push([g.point.lat, g.point.lng])
    if (points.length < 2) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
  }, [active, guess, truth, extras, map])
  return null
}

export function GuessMap({ roundKey, guess, truth, onGuess, revealed, extraGuesses = [] }: Props) {
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
      {revealed && extraGuesses.map((g) => (
        <Marker key={g.label} position={[g.point.lat, g.point.lng]} icon={otherGuessIcon}>
          <Tooltip permanent direction="top" offset={[0, -10]} className="player-tooltip">
            {g.label}
          </Tooltip>
        </Marker>
      ))}
      {revealed && truth && extraGuesses.map((g) => (
        <Polyline
          key={`line-${g.label}`}
          positions={[
            [g.point.lat, g.point.lng],
            [truth.lat, truth.lng],
          ]}
          pathOptions={{ color: '#7b8aa3', weight: 2, dashArray: '4 4', opacity: 0.6 }}
        />
      ))}
      <FitToReveal guess={guess} truth={truth} extras={extraGuesses} active={revealed} />
    </MapContainer>
  )
}
