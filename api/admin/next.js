import {
  getState,
  setState,
  startRound,
  methodNotAllowed,
} from '../_lib/state.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);

  const state = await getState();

  if (state.phase === 'round') {
    state.phase = 'reveal';
    await setState(state);
    return res.status(200).json({ ok: true, phase: 'reveal' });
  }

  if (state.phase === 'reveal') {
    const next = state.currentRound + 1;
    if (next >= state.roundOrder.length) {
      state.phase = 'finished';
    } else {
      startRound(state, next);
    }
    await setState(state);
    return res.status(200).json({ ok: true, phase: state.phase });
  }

  res.status(409).json({ ok: false, error: 'Aktion nicht erlaubt im aktuellen Status.' });
}
