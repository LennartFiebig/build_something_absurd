import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Vite-friendly default marker icon fix.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export const guessIcon = L.divIcon({
  className: 'guess-pin',
  html: '<div class="guess-pin__inner">?</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export const truthIcon = L.divIcon({
  className: 'truth-pin',
  html: '<div class="truth-pin__inner">★</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

export const otherGuessIcon = L.divIcon({
  className: 'other-pin',
  html: '<div class="other-pin__inner"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
