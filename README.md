# Kahoot Clone

Kleines Quiz mit drei Fragen. Spieler tragen ihren Vornamen ein, beantworten gleichzeitig die Fragen, der Admin sieht das Live-Leaderboard.

Architektur: Vercel Serverless Functions (`api/*`) + Upstash Redis als State Store. Clients pollen `GET /api/state` jede Sekunde.

## Deployment auf Vercel

1. **Upstash Redis** anlegen (kostenlos):
   - Im Vercel-Dashboard → Storage → Marketplace → **Upstash for Redis** → mit dem Projekt verknüpfen. `UPSTASH_REDIS_REST_URL` und `UPSTASH_REDIS_REST_TOKEN` werden dann automatisch als Env-Vars gesetzt.
   - Alternativ direkt bei https://upstash.com einen Store erstellen und beide Werte unter Vercel → Project → Settings → Environment Variables eintragen.

2. **Deployen:**
   ```
   npx vercel
   npx vercel --prod
   ```

## Routen

- `/` – Spieler-View
- `/admin.html` – Admin-View

## Lokal testen

```
npx vercel link
npx vercel env pull .env.local
npx vercel dev
```
