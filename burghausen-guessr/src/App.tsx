import { useMemo, useState } from 'react'
import './leaflet-setup'
import './App.css'
import { LOCATIONS, pickRandomLocation, type Location } from './locations'
import { LocationView } from './LocationView'
import { GuessMap } from './GuessMap'
import { formatDistance, haversineMeters, scoreFromDistance } from './distance'

type LatLng = { lat: number; lng: number }

type Round = {
  truth: Location
  guess: LatLng | null
  submitted: boolean
}

function newRound(prev?: Location): Round {
  return { truth: pickRandomLocation(prev?.id), guess: null, submitted: false }
}

export default function App() {
  const [round, setRound] = useState<Round>(() => newRound())
  const [totalScore, setTotalScore] = useState(0)
  const [roundsPlayed, setRoundsPlayed] = useState(0)

  const result = useMemo(() => {
    if (!round.submitted || !round.guess) return null
    const distance = haversineMeters(round.guess, round.truth)
    const score = scoreFromDistance(distance)
    return { distance, score }
  }, [round])

  function submit() {
    if (!round.guess || round.submitted) return
    const distance = haversineMeters(round.guess, round.truth)
    setRound(r => ({ ...r, submitted: true }))
    setTotalScore(s => s + scoreFromDistance(distance))
    setRoundsPlayed(n => n + 1)
  }

  function next() {
    setRound(r => newRound(r.truth))
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>
          Burghausen<span>Guessr</span>
        </h1>
        <div className="app__score">
          <div>
            <span className="label">Runde</span>
            <span className="value">{roundsPlayed + (round.submitted ? 0 : 1)}</span>
          </div>
          <div>
            <span className="label">Gesamt</span>
            <span className="value">{totalScore.toLocaleString('de-DE')}</span>
          </div>
        </div>
      </header>

      <main className="app__main">
        <section className="panel panel--view">
          <div className="panel__head">
            <span>Wo bist du?</span>
            <small>{LOCATIONS.length} mögliche Orte in Burghausen</small>
          </div>
          <LocationView location={round.truth} />
        </section>

        <section className="panel panel--guess">
          <div className="panel__head">
            <span>Setze deinen Pin</span>
            <small>
              {round.guess
                ? `${round.guess.lat.toFixed(5)}, ${round.guess.lng.toFixed(5)}`
                : 'Klicke auf die Karte'}
            </small>
          </div>
          <GuessMap
            roundKey={round.truth.id}
            guess={round.guess}
            truth={round.truth}
            onGuess={p => setRound(r => (r.submitted ? r : { ...r, guess: p }))}
            revealed={round.submitted}
          />
        </section>
      </main>

      <footer className="app__footer">
        {!round.submitted ? (
          <button className="btn btn--primary" onClick={submit} disabled={!round.guess}>
            Tipp abgeben
          </button>
        ) : (
          <>
            <div className="result">
              <div className="result__line">
                <span className="label">Entfernung</span>
                <strong>{formatDistance(result!.distance)}</strong>
              </div>
              <div className="result__line">
                <span className="label">Punkte</span>
                <strong>{result!.score.toLocaleString('de-DE')}</strong>
              </div>
              <div className="result__line">
                <span className="label">Ort</span>
                <strong>{round.truth.name}</strong>
              </div>
            </div>
            <button className="btn btn--primary" onClick={next}>
              Nächste Runde
            </button>
          </>
        )}
      </footer>
    </div>
  )
}
