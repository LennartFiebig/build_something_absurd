import { useState } from 'react'
import './leaflet-setup'
import './App.css'
import { GuessMap } from './GuessMap'
import { formatDistance } from './distance'
import { adminNext, adminReset, adminStart, type GameState } from './api'
import { useGame } from './useGame'

export function Admin() {
  const { state, error } = useGame(null, 1500)

  if (!state) {
    return (
      <div className="join">
        <div className="join__card">
          <h1>Admin</h1>
          <p>Lade…</p>
          {error && <p className="join__err">{error}</p>}
        </div>
      </div>
    )
  }

  return <AdminBody state={state} />
}

function AdminBody({ state }: { state: GameState }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const phase = state.phase
  const round = state.round
  const truth = round?.truth ?? null
  const revealed = phase === 'reveal' || phase === 'finished'

  async function run(fn: () => Promise<unknown>) {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      await fn()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setBusy(false)
    }
  }

  const submittedCount = state.players.filter((p) => p.submitted).length

  return (
    <div className="app admin">
      <header className="app__header">
        <h1>Admin <span>•</span> BurghausenGuessr</h1>
        <div className="app__score">
          <div>
            <span className="label">Phase</span>
            <span className="value">{phaseLabel(phase)}</span>
          </div>
          {round && (
            <div>
              <span className="label">Runde</span>
              <span className="value">{round.index + 1}/{round.total}</span>
            </div>
          )}
          <div>
            <span className="label">Spieler:innen</span>
            <span className="value">{state.players.length}</span>
          </div>
        </div>
      </header>

      <main className="app__main">
        <section className="panel panel--view">
          <div className="panel__head">
            <span>{phase === 'lobby' ? 'Lobby' : 'Standort'}</span>
            <small>{phase === 'round' ? `${submittedCount}/${state.players.length} getippt` : ''}</small>
          </div>
          {phase === 'lobby' && (
            <div className="lobby-body">
              <p>Warte auf Spieler:innen — sie öffnen <code>/</code> auf ihrem Gerät.</p>
            </div>
          )}
          {phase !== 'lobby' && round && (
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
            <span>Karte</span>
            <small>{revealed && truth ? truth.name : ''}</small>
          </div>
          {phase === 'lobby' ? (
            <div className="lobby-body">
              <Players players={state.players} />
            </div>
          ) : (
            <AdminMap
              roundKey={String(round?.index ?? 'none')}
              truth={truth}
              players={state.players}
              revealed={revealed}
            />
          )}
        </section>
      </main>

      <footer className="app__footer admin__footer">
        <div className="controls">
          <button
            className="btn btn--primary"
            onClick={() => run(adminStart)}
            disabled={busy || phase !== 'lobby' || state.players.length === 0}
          >
            Spiel starten
          </button>
          <button
            className="btn btn--primary"
            onClick={() => run(adminNext)}
            disabled={busy || (phase !== 'round' && phase !== 'reveal')}
          >
            {phase === 'round' ? 'Auflösen' : 'Nächste Runde'}
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              if (confirm('Wirklich zurücksetzen? Alle Punkte gehen verloren.')) run(adminReset)
            }}
            disabled={busy}
          >
            Reset
          </button>
        </div>
        <div className="admin__leaderboard">
          <Leaderboard players={state.players} />
        </div>
        {err && <p className="join__err">{err}</p>}
      </footer>
    </div>
  )
}

function phaseLabel(p: GameState['phase']): string {
  switch (p) {
    case 'lobby': return 'Lobby'
    case 'round': return 'Runde läuft'
    case 'reveal': return 'Auflösung'
    case 'finished': return 'Endstand'
  }
}

function Players({ players }: { players: GameState['players'] }) {
  if (players.length === 0) return <p className="muted">Noch niemand…</p>
  return (
    <ul className="players players--admin">
      {players.map((p) => <li key={p.name}>{p.name}</li>)}
    </ul>
  )
}

function AdminMap({
  roundKey,
  truth,
  players,
  revealed,
}: {
  roundKey: string
  truth: { lat: number; lng: number } | null
  players: GameState['players']
  revealed: boolean
}) {
  return (
    <GuessMap
      roundKey={roundKey}
      guess={null}
      truth={truth}
      onGuess={() => {}}
      revealed={revealed}
      extraGuesses={revealed
        ? players
            .filter((p) => p.lastGuess)
            .map((p) => ({ point: p.lastGuess!, label: p.name }))
        : []
      }
    />
  )
}

function Leaderboard({ players }: { players: GameState['players'] }) {
  return (
    <ol className="leaderboard">
      {players.map((p, i) => (
        <li key={p.name}>
          <span className="rank">{i + 1}</span>
          <span className="name">{p.name}</span>
          <span className="score">{p.score.toLocaleString('de-DE')}</span>
          {p.lastDistance != null && (
            <span className="delta">{formatDistance(p.lastDistance)} · +{p.lastPoints.toLocaleString('de-DE')}</span>
          )}
        </li>
      ))}
    </ol>
  )
}
