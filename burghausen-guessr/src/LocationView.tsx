import { MapContainer, TileLayer } from 'react-leaflet'
import type { Location } from './locations'

type Props = {
  location: Location
  zoom?: number
}

// Non-interactive zoomed-in aerial view: this is what the player sees as "where am I?".
// We strip controls and lock interaction so the player can't pan/zoom out for hints.
export function LocationView({ location, zoom = 18 }: Props) {
  return (
    <MapContainer
      key={location.id}
      center={[location.lat, location.lng]}
      zoom={zoom}
      minZoom={zoom}
      maxZoom={zoom}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      className="location-view"
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
    </MapContainer>
  )
}
