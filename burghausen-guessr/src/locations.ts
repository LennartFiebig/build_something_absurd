export type Location = {
  id: string
  name: string
  lat: number
  lng: number
  image: string
}

export const BURGHAUSEN_CENTER: [number, number] = [48.1633, 12.8254]

export const BURGHAUSEN_BOUNDS: [[number, number], [number, number]] = [
  [48.144, 12.795],
  [48.185, 12.870],
]

export const LOCATIONS: Location[] = [
  { id: 'spot-1', name: 'Spot 1', lat: 48.171237, lng: 12.830449, image: '/streetview/spot-1.jpeg' },
  { id: 'spot-2', name: 'Spot 2', lat: 48.160637, lng: 12.831145, image: '/streetview/spot-2.jpeg' },
  { id: 'spot-3', name: 'Spot 3', lat: 48.156419, lng: 12.826723, image: '/streetview/spot-3.jpeg' },
  { id: 'spot-4', name: 'Spot 4', lat: 48.152339, lng: 12.823815, image: '/streetview/spot-4.jpeg' },
  { id: 'spot-5', name: 'Spot 5', lat: 48.153848, lng: 12.830093, image: '/streetview/spot-5.jpeg' },
]

export function pickRandomLocation(exclude?: string): Location {
  const pool = exclude ? LOCATIONS.filter(l => l.id !== exclude) : LOCATIONS
  return pool[Math.floor(Math.random() * pool.length)]
}
