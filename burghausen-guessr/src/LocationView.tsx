import type { Location } from './locations'

type Props = {
  location: Location
}

export function LocationView({ location }: Props) {
  return (
    <div className="location-view">
      <img
        key={location.id}
        src={location.image}
        alt="Street view"
        className="location-view__img"
        draggable={false}
      />
    </div>
  )
}
