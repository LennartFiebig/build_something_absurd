export type Phase = 'lobby' | 'round' | 'reveal' | 'finished'

export type LatLng = { lat: number; lng: number }

export type PublicPlayer = {
  name: string
  score: number
  submitted: boolean
  lastPoints: number
  lastDistance: number | null
  lastGuess: LatLng | null
}

export type PublicRound = {
  index: number
  total: number
  image: string
  startedAt: number
  truth: { lat: number; lng: number; name: string } | null
}

export type Me = {
  id: string
  name: string
  score: number
  submitted: boolean
  guess: LatLng | null
  lastPoints: number
  lastDistance: number | null
}

export type GameState = {
  phase: Phase
  round: PublicRound | null
  players: PublicPlayer[]
  me: Me | null
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = (body as { error?: string })?.error || `HTTP ${res.status}`
    throw new Error(err)
  }
  return body as T
}

export function fetchState(playerId?: string): Promise<GameState> {
  const qs = playerId ? `?playerId=${encodeURIComponent(playerId)}` : ''
  return jsonFetch<GameState>(`/api/state${qs}`)
}

export function postJoin(name: string): Promise<{ ok: true; playerId: string; name: string }> {
  return jsonFetch('/api/join', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function postGuess(
  playerId: string,
  lat: number,
  lng: number,
): Promise<{ ok: true; distance: number; points: number }> {
  return jsonFetch('/api/guess', {
    method: 'POST',
    body: JSON.stringify({ playerId, lat, lng }),
  })
}

export function adminStart(): Promise<{ ok: true }> {
  return jsonFetch('/api/admin/start', { method: 'POST' })
}

export function adminNext(): Promise<{ ok: true; phase: Phase }> {
  return jsonFetch('/api/admin/next', { method: 'POST' })
}

export function adminReset(): Promise<{ ok: true }> {
  return jsonFetch('/api/admin/reset', { method: 'POST' })
}
