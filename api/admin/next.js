const {
  QUESTIONS,
  getState,
  setState,
  startQuestion,
  methodNotAllowed,
} = require('../_lib/state');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);

  const state = await getState();

  if (state.phase === 'question') {
    state.phase = 'reveal';
    await setState(state);
    return res.status(200).json({ ok: true, phase: 'reveal' });
  }

  if (state.phase === 'reveal') {
    const next = state.currentQuestion + 1;
    if (next >= QUESTIONS.length) {
      state.phase = 'finished';
    } else {
      startQuestion(state, next);
    }
    await setState(state);
    return res.status(200).json({ ok: true, phase: state.phase });
  }

  res.status(409).json({ ok: false, error: 'Aktion nicht erlaubt im aktuellen Status.' });
};
