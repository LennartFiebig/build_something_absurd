const crypto = require('crypto');
const {
  getState,
  setState,
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

  const name = String(body?.name || '').trim().slice(0, 20);
  if (!name) {
    return res.status(400).json({ ok: false, error: 'Bitte einen Vornamen eingeben.' });
  }

  const state = await getState();
  if (state.phase !== 'lobby') {
    return res.status(409).json({ ok: false, error: 'Spiel hat bereits begonnen.' });
  }

  const taken = Object.values(state.players).some(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
  if (taken) {
    return res.status(409).json({ ok: false, error: 'Name bereits vergeben.' });
  }

  const id = crypto.randomUUID();
  state.players[id] = { name, answered: false, lastPoints: 0, lastCorrect: null };
  await setState(state);

  res.status(200).json({ ok: true, playerId: id, name });
};
