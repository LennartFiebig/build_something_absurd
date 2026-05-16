import { useEffect, useState } from 'react'
import './leaflet-setup'
import './App.css'
import { GuessMap } from './GuessMap'
import { formatDistance } from './distance'
import { postGuess, postJoin, type GameState, type LatLng } from './api'
import { useGame } from './useGame'

const STORAGE_KEY = 'bgg:player'

type Stored = { id: string; name: string }

function loadStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Stored
  } catch {
    return null
  }
}

function saveStored(s: Stored | null) {
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  else localStorage.removeItem(STORAGE_KEY)
}

export function Player() {
  const [stored, setStored] = useState<Stored | null>(() => loadStored())
  const { state, fetchedForPlayerId, error } = useGame(stored?.id ?? null)

  // If the server doesn't know our player anymore (e.g. after a reset),
  // drop the stored id so we re-join. Only act on responses that were
  // actually fetched with our current id, otherwise we'd wipe a freshly
  // stored id before the next poll cycle confirms the server has us.
  useEffect(() => {
    if (!stored || !state) return
    if (fetchedForPlayerId !== stored.id) return
    if (state.me) return
    setStored(null)
    saveStored(null)
  }, [stored, state, fetchedForPlayerId])

  if (!stored) {
    return (
      <JoinScreen
        onJoin={(s) => { setStored(s); saveStored(s) }}
        disabled={state != null && state.phase !== 'lobby'}
      />
    )
  }

  // We have a stored id but the server hasn't confirmed it yet — show a
  // brief waiting state instead of bouncing back to JoinScreen.
  if (!state || fetchedForPlayerId !== stored.id || !state.me) {
    return (
      <div className="join">
        <div className="join__card">
          <h1>Burghausen<span>Guessr</span></h1>
          <p className="join__hint">Verbinde dich…</p>
          {error && <p className="join__err">{error}</p>}
        </div>
      </div>
    )
  }

  return <PlayScreen state={state} playerId={stored.id} error={error} />
}

function JoinScreen({
  onJoin,
  disabled,
}: {
  onJoin: (s: Stored) => void
  disabled: boolean
}) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    setErr(null)
    try {
      const res = await postJoin(name.trim())
      onJoin({ id: res.playerId, name: res.name })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="join">
      <div className="join__card">
        <h1>Burghausen<span>Guessr</span></h1>
        <p className="join__hint">
          Gib deinen Vornamen ein, um mitzuspielen. Der Host startet die Runde.
        </p>
        <form onSubmit={submit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vorname"
            maxLength={20}
            autoFocus
          />
          <button className="btn btn--primary" disabled={!name.trim() || busy || disabled}>
            {busy ? '…' : 'Mitspielen'}
          </button>
        </form>
        {disabled && (
          <p className="join__warn">Spiel läuft bereits — bitte warten, bis es zurückgesetzt wird.</p>
        )}
        {err && <p className="join__err">{err}</p>}
      </div>
    </div>
  )
}

function PlayScreen({
  state,
  playerId,
  error,
}: {
  state: GameState
  playerId: string
  error: string | null
}) {
  const [pendingGuess, setPendingGuess] = useState<LatLng | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  const phase = state.phase
  const me = state.me!
  const round = state.round
  const truth = round?.truth ?? null

  // Reset the local pending guess whenever a new round starts.
  useEffect(() => {
    setPendingGuess(null)
    setSubmitErr(null)
  }, [round?.index, phase])

  const revealed = phase === 'reveal' || phase === 'finished'
  const guess: LatLng | null = revealed
    ? me.guess
    : me.submitted
      ? me.guess
      : pendingGuess

  async function submit() {
    if (!pendingGuess || submitting || me.submitted) return
    setSubmitting(true)
    setSubmitErr(null)
    try {
      await postGuess(playerId, pendingGuess.lat, pendingGuess.lng)
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'lobby') {
    return (
      <Shell name={me.name} round={null} totalRounds={null} score={me.score}>
        <section className="panel panel--full">
          <div className="panel__head"><span>Lobby</span></div>
          <div className="lobby-body">
            <p>Warte auf den Host…</p>
            <PlayersList players={state.players} highlight={me.name} />
          </div>
        </section>
      </Shell>
    )
  }

  if (phase === 'finished') {
    return (
      <Shell name={me.name} round={null} totalRounds={round?.total ?? null} score={me.score}>
        <section className="panel panel--full">
          <div className="panel__head"><span>Endstand</span></div>
          <div className="lobby-body">
            <Leaderboard players={state.players} highlight={me.name} />
          </div>
        </section>
      </Shell>
    )
  }

  return (
    <Shell
      name={me.name}
      round={round ? round.index + 1 : null}
      totalRounds={round?.total ?? null}
      score={me.score}
    >
      <main className="app__main">
        <section className="panel panel--view">
          <div className="panel__head">
            <span>Wo bist du?</span>
            <small>{state.players.length} Spieler:innen</small>
          </div>
          {round && (
            <div className="location-view">
              <img
                key={round.index}
                src={round.image}
                alt="Street view"
                className="location-view__img"
                draggable={false}
              />
            </div>
          )}
        </section>

        <section className="panel panel--guess">
          <div className="panel__head">
            <span>Setze deinen Pin</span>
            <small>
              {guess
                ? `${guess.lat.toFixed(5)}, ${guess.lng.toFixed(5)}`
                : me.submitted
                  ? 'Tipp abgegeben'
                  : 'Klicke auf die Karte'}
            </small>
          </div>
          <GuessMap
            roundKey={String(round?.index ?? 'none')}
            guess={guess}
            truth={truth}
            onGuess={(p) => {
              if (revealed || me.submitted) return
              setPendingGuess(p)
            }}
            revealed={revealed}
          />
        </section>
      </main>

      <footer className="app__footer">
        {phase === 'round' && !me.submitted && (
          <>
            <div className="result"><WaitingFor players={state.players} /></div>
            <button
              className="btn btn--primary"
              onClick={submit}
              disabled={!pendingGuess || submitting}
            >
              {submitting ? '…' : 'Tipp abgeben'}
            </button>
          </>
        )}
        {phase === 'round' && me.submitted && (
          <>
            <div className="result"><span className="muted">Warte auf die anderen…</span></div>
            <WaitingFor players={state.players} />
          </>
        )}
        {revealed && (
          <div className="reveal">
            <div className="reveal__row">
              <div className="result__line">
                <span className="label">Entfernung</span>
                <strong>
                  {me.lastDistance != null ? formatDistance(me.lastDistance) : '—'}
                </strong>
              </div>
              <div className="result__line">
                <span className="label">Punkte</span>
                <strong>{me.lastPoints.toLocaleString('de-DE')}</strong>
              </div>
              <div className="result__line">
                <span className="label">Ort</span>
                <strong>{round?.truth?.name ?? '—'}</strong>
              </div>
            </div>
            <Leaderboard players={state.players} highlight={me.name} compact />
          </div>
        )}
        {(error || submitErr) && (
          <p className="join__err">{submitErr || error}</p>
        )}
      </footer>
    </Shell>
  )
}

function Shell({
  name,
  round,
  totalRounds,
  score,
  children,
}: {
  name: string
  round: number | null
  totalRounds: number | null
  score: number
  children: React.ReactNode
}) {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Burghausen<span>Guessr</span></h1>
        <div className="app__score">
          <div>
            <span className="label">Spieler</span>
            <span className="value">{name}</span>
          </div>
          {round != null && totalRounds != null && (
            <div>
              <span className="label">Runde</span>
              <span className="value">{round}/{totalRounds}</span>
            </div>
          )}
          <div>
            <span className="label">Punkte</span>
            <span className="value">{score.toLocaleString('de-DE')}</span>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

function PlayersList({ players, highlight }: { players: GameState['players']; highlight: string }) {
  if (players.length === 0) return <p className="muted">Noch niemand…</p>
  return (
    <ul className="players">
      {players.map((p) => (
        <li key={p.name} className={p.name === highlight ? 'is-me' : ''}>
          <span>{p.name}</span>
        </li>
      ))}
    </ul>
  )
}

function WaitingFor({ players }: { players: GameState['players'] }) {
  const submitted = players.filter((p) => p.submitted).length
  return (
    <span className="muted">
      {submitted}/{players.length} haben getippt
    </span>
  )
}

function Leaderboard({
  players,
  highlight,
  compact,
}: {
  players: GameState['players']
  highlight: string
  compact?: boolean
}) {
  return (
    <ol className={`leaderboard ${compact ? 'leaderboard--compact' : ''}`}>
      {players.map((p, i) => (
        <li key={p.name} className={p.name === highlight ? 'is-me' : ''}>
          <span className="rank">{i + 1}</span>
          <span className="name">{p.name}</span>
          <span className="score">{p.score.toLocaleString('de-DE')}</span>
          {compact && p.lastPoints > 0 && (
            <span className="delta">+{p.lastPoints.toLocaleString('de-DE')}</span>
          )}
        </li>
      ))}
    </ol>
  )
}
