const {
  setState,
  initialState,
  resetScores,
  methodNotAllowed,
} = require('../_lib/state');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);
  await setState(initialState());
  await resetScores();
  res.status(200).json({ ok: true });
};
