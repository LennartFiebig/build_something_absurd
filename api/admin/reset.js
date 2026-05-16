import { setState, initialState, methodNotAllowed } from '../_lib/state.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);
  await setState(initialState());
  res.status(200).json({ ok: true });
}
