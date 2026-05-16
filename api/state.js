const {
  getState,
  publicPlayers,
  publicQuestion,
  maybeAutoReveal,
  methodNotAllowed,
} = require('./_lib/state');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);

  let state = await getState();
  state = await maybeAutoReveal(state);

  const playerId = req.query?.playerId || '';
  const me = state.players[playerId]
    ? {
        id: playerId,
        name: state.players[playerId].name,
        score: state.players[playerId].score,
        answered: state.players[playerId].answered,
      }
    : null;

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    phase: state.phase,
    currentQuestion: state.currentQuestion,
    totalQuestions: 3,
    questionStartedAt: state.questionStartedAt,
    question: publicQuestion(state),
    players: publicPlayers(state),
    me,
  });
};
