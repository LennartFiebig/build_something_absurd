const KEY = 'kahoot:state';

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
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
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

function initialState() {
  return {
    phase: 'lobby',
    currentQuestion: -1,
    questionStartedAt: 0,
    players: {},
  };
}

async function getState() {
  const raw = await redis(['GET', KEY]);
  if (!raw) return initialState();
  try {
    return JSON.parse(raw);
  } catch {
    return initialState();
  }
}

async function setState(s) {
  await redis(['SET', KEY, JSON.stringify(s)]);
}

function publicPlayers(state) {
  return Object.values(state.players)
    .map((p) => ({ name: p.name, score: p.score, answered: p.answered }))
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
  }
  return state;
}

function methodNotAllowed(req, res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: 'Method not allowed' });
}

async function readBody(req) {
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

module.exports = {
  QUESTIONS,
  getState,
  setState,
  initialState,
  publicPlayers,
  publicQuestion,
  maybeAutoReveal,
  startQuestion,
  methodNotAllowed,
  readBody,
};
