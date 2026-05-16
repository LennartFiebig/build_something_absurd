import { LOCATIONS } from './locations.js';

const KEY = 'geoguessr:state';

function pickRedisCreds() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

async function redis(args) {
  const { url, token } = pickRedisCreds();
  if (!url || !token) {
    throw new Error('Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN');
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initialState() {
  return {
    phase: 'lobby',
    currentRound: -1,
    roundOrder: [],
    roundStartedAt: 0,
    players: {},
  };
}

export async function getState() {
  const raw = await redis(['GET', KEY]);
  if (!raw) return initialState();
  try {
    return JSON.parse(raw);
  } catch {
    return initialState();
  }
}

export async function setState(s) {
  await redis(['SET', KEY, JSON.stringify(s)]);
}

export function currentLocation(state) {
  if (state.currentRound < 0) return null;
  const id = state.roundOrder[state.currentRound];
  return LOCATIONS.find((l) => l.id === id) || null;
}

export function publicPlayers(state) {
  return Object.values(state.players)
    .map((p) => ({
      name: p.name,
      score: p.score,
      submitted: p.submitted,
      lastPoints: p.lastPoints,
      lastDistance: p.lastDistance,
      lastGuess: p.guess,
    }))
    .sort((a, b) => b.score - a.score);
}

export function publicRound(state) {
  const loc = currentLocation(state);
  if (!loc) return null;
  const reveal = state.phase === 'reveal' || state.phase === 'finished';
  return {
    index: state.currentRound,
    total: state.roundOrder.length,
    image: loc.image,
    startedAt: state.roundStartedAt,
    truth: reveal ? { lat: loc.lat, lng: loc.lng, name: loc.name } : null,
  };
}

export function startRound(state, index) {
  if (index >= state.roundOrder.length) {
    state.phase = 'finished';
    return state;
  }
  state.phase = 'round';
  state.currentRound = index;
  state.roundStartedAt = Date.now();
  for (const id of Object.keys(state.players)) {
    state.players[id].submitted = false;
    state.players[id].guess = null;
    state.players[id].lastPoints = 0;
    state.players[id].lastDistance = null;
  }
  return state;
}

export function methodNotAllowed(req, res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: 'Method not allowed' });
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export { LOCATIONS };
