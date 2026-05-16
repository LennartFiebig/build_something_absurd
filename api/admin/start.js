const {
  getState,
  setState,
  startQuestion,
  methodNotAllowed,
} = require('../_lib/state');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);

  const state = await getState();
  if (state.phase !== 'lobby') {
    return res.status(409).json({ ok: false, error: 'Spiel läuft bereits.' });
  }
  if (Object.keys(state.players).length === 0) {
    return res.status(409).json({ ok: false, error: 'Noch keine Spieler.' });
  }

  startQuestion(state, 0);
  await setState(state);
  res.status(200).json({ ok: true });
};
