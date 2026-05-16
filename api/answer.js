const {
  QUESTIONS,
  getState,
  setState,
  incrScore,
  maybeAutoReveal,
  methodNotAllowed,
  readBody,
} = require('./_lib/state');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: 'Ungültige Anfrage' });
  }

  const playerId = String(body?.playerId || '');
  const choice = Number(body?.choice);

  let state = await getState();
  state = await maybeAutoReveal(state);

  const player = state.players[playerId];
  if (!player) return res.status(404).json({ ok: false, error: 'Spieler unbekannt.' });
  if (state.phase !== 'question') {
    return res.status(409).json({ ok: false, error: 'Keine Frage aktiv.' });
  }
  if (player.answered) {
    return res.status(409).json({ ok: false, error: 'Bereits geantwortet.' });
  }

  const q = QUESTIONS[state.currentQuestion];
  if (!Number.isInteger(choice) || choice < 0 || choice >= q.answers.length) {
    return res.status(400).json({ ok: false, error: 'Ungültige Antwort.' });
  }

  const elapsed = Date.now() - state.questionStartedAt;
  const correct = choice === q.correct;
  let points = 0;
  if (correct) {
    const ratio = Math.max(0, 1 - elapsed / q.timeMs);
    points = Math.round(500 + 500 * ratio);
    await incrScore(playerId, points);
  }

  player.answered = true;
  player.lastPoints = points;
  player.lastCorrect = correct;

  const allAnswered =
    Object.keys(state.players).length > 0 &&
    Object.values(state.players).every((p) => p.answered);
  if (allAnswered) state.phase = 'reveal';

  await setState(state);

  res.status(200).json({ ok: true, correct, points });
};
