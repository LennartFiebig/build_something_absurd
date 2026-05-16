import { useEffect, useRef, useState } from 'react'
import { fetchState, type GameState } from './api'

export type GameFetch = {
  state: GameState
  fetchedForPlayerId: string | null
}

export function useGame(playerId: string | null, intervalMs = 1500) {
  const [fetched, setFetched] = useState<GameFetch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const playerIdRef = useRef(playerId)
  playerIdRef.current = playerId

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    async function tick() {
      const id = playerIdRef.current
      try {
        const s = await fetchState(id || undefined)
        if (!cancelled) {
          setFetched({ state: s, fetchedForPlayerId: id })
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) timer = window.setTimeout(tick, intervalMs)
      }
    }
    tick()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [intervalMs])

  // When playerId changes, force an immediate refetch so the UI doesn't
  // wait an entire poll cycle (and so the join → play transition is instant).
  useEffect(() => {
    let cancelled = false
    if (playerId == null) return
    fetchState(playerId)
      .then((s) => {
        if (!cancelled) setFetched({ state: s, fetchedForPlayerId: playerId })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [playerId])

  return {
    state: fetched?.state ?? null,
    fetchedForPlayerId: fetched?.fetchedForPlayerId ?? null,
    error,
  }
}
