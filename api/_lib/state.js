const STATE_KEY = 'kahoot:state';
const SCORES_KEY = 'kahoot:scores';

const QUESTIONS = [
  {
    question: 'Welche Stadt ist die Hauptstadt von Australien?',
    answers: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correct: 2,
    timeMs: 15000,
  },
  {
    question: 'Wie viele Planeten hat unser Sonnensystem?',
    answers: ['7', '8', '9', '10'],
    correct: 1,
    timeMs: 15000,
  },
  {
    question: 'Welches Element hat das Symbol "Au"?',
    answers: ['Silber', 'Aluminium', 'Argon', 'Gold'],
    correct: 3,
    timeMs: 15000,
  },
];

async function redis(args) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      'Missing Redis env vars (UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN)'
    );
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

function initialState() {
  return {
    phase: 'lobby',
    currentQuestion: -1,
    questionStartedAt: 0,
    players: {},
  };
}

async function getState() {
  const raw = await redis(['GET', STATE_KEY]);
  if (!raw) return initialState();
  try {
    return JSON.parse(raw);
  } catch {
    return initialState();
  }
}

async function setState(s) {
  await redis(['SET', STATE_KEY, JSON.stringify(s)]);
}

async function getScores() {
  const result = await redis(['HGETALL', SCORES_KEY]);
  if (!result) return {};
  if (Array.isArray(result)) {
    const obj = {};
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = Number(result[i + 1]) || 0;
    }
    return obj;
  }
  const obj = {};
  for (const [k, v] of Object.entries(result)) obj[k] = Number(v) || 0;
  return obj;
}

async function incrScore(playerId, by) {
  if (!by) return;
  await redis(['HINCRBY', SCORES_KEY, playerId, String(by)]);
}

async function resetScores() {
  await redis(['DEL', SCORES_KEY]);
}

function publicPlayers(state, scores) {
  return Object.entries(state.players)
    .map(([id, p]) => ({
      name: p.name,
      score: scores[id] || 0,
      answered: !!p.answered,
    }))
    .sort((a, b) => b.score - a.score);
}

function publicQuestion(state) {
  if (state.currentQuestion < 0) return null;
  const q = QUESTIONS[state.currentQuestion];
  if (!q) return null;
  const reveal = state.phase === 'reveal' || state.phase === 'finished';
  return {
    index: state.currentQuestion,
    total: QUESTIONS.length,
    question: q.question,
    answers: q.answers,
    timeMs: q.timeMs,
    startedAt: state.questionStartedAt,
    correct: reveal ? q.correct : null,
  };
}

async function maybeAutoReveal(state) {
  if (state.phase !== 'question') return state;
  const q = QUESTIONS[state.currentQuestion];
  if (!q) return state;
  if (Date.now() - state.questionStartedAt > q.timeMs + 300) {
    state.phase = 'reveal';
    await setState(state);
  }
  return state;
}

function startQuestion(state, index) {
  if (index >= QUESTIONS.length) {
    state.phase = 'finished';
    return state;
  }
  state.phase = 'question';
  state.currentQuestion = index;
  state.questionStartedAt = Date.now();
  for (const id of Object.keys(state.players)) {
    state.players[id].answered = false;
    state.players[id].lastPoints = 0;
    state.players[id].lastCorrect = null;
  }
  return state;
}

function methodNotAllowed(req, res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: 'Method not allowed' });
}

async function readBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch { return {}; }
    }
  }
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

module.exports = {
  QUESTIONS,
  getState,
  setState,
  initialState,
  getScores,
  incrScore,
  resetScores,
  publicPlayers,
  publicQuestion,
  maybeAutoReveal,
  startQuestion,
  methodNotAllowed,
  readBody,
};
