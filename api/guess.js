import {
  getState,
  setState,
  currentLocation,
  methodNotAllowed,
  readBody,
} from './_lib/state.js';
import { haversineMeters, scoreFromDistance } from './_lib/locations.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: 'Ungültige Anfrage' });
  }

  const playerId = String(body?.playerId || '');
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ ok: false, error: 'Ungültiger Tipp.' });
  }

  const state = await getState();
  const player = state.players[playerId];
  if (!player) return res.status(404).json({ ok: false, error: 'Spieler unbekannt.' });
  if (state.phase !== 'round') {
    return res.status(409).json({ ok: false, error: 'Keine Runde aktiv.' });
  }
  if (player.submitted) {
    return res.status(409).json({ ok: false, error: 'Bereits getippt.' });
  }

  const truth = currentLocation(state);
  if (!truth) {
    return res.status(409).json({ ok: false, error: 'Keine Runde aktiv.' });
  }

  const distance = haversineMeters({ lat, lng }, truth);
  const points = scoreFromDistance(distance);

  player.guess = { lat, lng };
  player.submitted = true;
  player.lastDistance = distance;
  player.lastPoints = points;
  player.score += points;

  const all =
    Object.keys(state.players).length > 0 &&
    Object.values(state.players).every((p) => p.submitted);
  if (all) state.phase = 'reveal';

  await setState(state);
  res.status(200).json({ ok: true, distance, points });
}
