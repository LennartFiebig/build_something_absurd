export const LOCATIONS = [
  { id: 'spot-1', name: 'Spot 1', lat: 48.171237, lng: 12.830449, image: '/streetview/spot-1.jpeg' },
  { id: 'spot-2', name: 'Spot 2', lat: 48.160637, lng: 12.831145, image: '/streetview/spot-2.jpeg' },
  { id: 'spot-3', name: 'Spot 3', lat: 48.156419, lng: 12.826723, image: '/streetview/spot-3.jpeg' },
  { id: 'spot-4', name: 'Spot 4', lat: 48.152339, lng: 12.823815, image: '/streetview/spot-4.jpeg' },
  { id: 'spot-5', name: 'Spot 5', lat: 48.153848, lng: 12.830093, image: '/streetview/spot-5.jpeg' },
];

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function scoreFromDistance(distanceM) {
  return Math.round(5000 * Math.exp(-distanceM / 500));
}
