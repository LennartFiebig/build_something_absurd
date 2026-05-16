# BurghausenGuessr

Multiplayer GeoGuessr-Klon für Burghausen. Spieler:innen sehen ein Foto und setzen einen Pin auf die Karte; alle tippen gleichzeitig, nach jeder Runde gibt es Punkte und ein Leaderboard.

## Routen

- `/` — Spieleransicht (mitspielen)
- `/admin` — Hostansicht (Spiel starten, Runden auflösen, zurücksetzen)

## Lokal entwickeln

```bash
npm install
npm run dev          # Vite-Frontend (nur Mockup ohne Backend)
# oder mit API:
vercel dev           # Frontend + Serverless-API mit Redis
```

`vercel dev` braucht `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
(oder `KV_REST_API_URL` / `KV_REST_API_TOKEN`) als Env-Variablen.

## Deployment

Vercel-Projekt — `vercel --prod`. Env-Variablen siehe oben.
