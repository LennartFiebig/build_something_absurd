import {
  getState,
  publicPlayers,
  publicRound,
  methodNotAllowed,
} from './_lib/state.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);

  const state = await getState();

  const playerId = req.query?.playerId || '';
  const me = state.players[playerId]
    ? {
        id: playerId,
        name: state.players[playerId].name,
        score: state.players[playerId].score,
        submitted: state.players[playerId].submitted,
        guess: state.players[playerId].guess,
        lastPoints: state.players[playerId].lastPoints,
        lastDistance: state.players[playerId].lastDistance,
      }
    : null;

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    phase: state.phase,
    round: publicRound(state),
    players: publicPlayers(state),
    me,
  });
}
