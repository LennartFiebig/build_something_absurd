const {
  getState,
  getScores,
  publicPlayers,
  publicQuestion,
  maybeAutoReveal,
  methodNotAllowed,
} = require('./_lib/state');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);

  let state = await getState();
  state = await maybeAutoReveal(state);
  const scores = await getScores();

  const playerId = req.query?.playerId || '';
  const meEntry = state.players[playerId];
  const me = meEntry
    ? {
        id: playerId,
        name: meEntry.name,
        score: scores[playerId] || 0,
        answered: !!meEntry.answered,
        lastPoints: meEntry.lastPoints || 0,
        lastCorrect: typeof meEntry.lastCorrect === 'boolean' ? meEntry.lastCorrect : null,
      }
    : null;

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    phase: state.phase,
    currentQuestion: state.currentQuestion,
    totalQuestions: 3,
    questionStartedAt: state.questionStartedAt,
    question: publicQuestion(state),
    players: publicPlayers(state, scores),
    me,
  });
};
