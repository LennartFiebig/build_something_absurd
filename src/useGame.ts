import { useEffect, useRef, useState } from 'react'
import { fetchState, type GameState } from './api'

export function useGame(playerId: string | null, intervalMs = 1500) {
  const [state, setState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const playerIdRef = useRef(playerId)
  playerIdRef.current = playerId

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    async function tick() {
      try {
        const s = await fetchState(playerIdRef.current || undefined)
        if (!cancelled) {
          setState(s)
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

  return { state, error }
}
