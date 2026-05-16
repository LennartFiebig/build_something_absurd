const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const QUESTIONS = [
  {
    question: 'Welche Stadt ist die Hauptstadt von Australien?',
    answers: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correct: 2,
    timeMs: 15000,
  },
  {
    question: 'Wie viele Planeten hat unser Sonnensystem?',
    answers: ['7', '8', '9', '10'],
    correct: 1,
    timeMs: 15000,
  },
  {
    question: 'Welches Element hat das Symbol "Au"?',
    answers: ['Silber', 'Aluminium', 'Argon', 'Gold'],
    correct: 3,
    timeMs: 15000,
  },
];

const state = {
  phase: 'lobby', // lobby | question | reveal | finished
  players: new Map(), // socketId -> { name, score, answered }
  currentQuestion: -1,
  questionStartedAt: 0,
  questionTimer: null,
};

function publicPlayers() {
  return Array.from(state.players.values())
    .map(p => ({ name: p.name, score: p.score, answered: p.answered }))
    .sort((a, b) => b.score - a.score);
}

function broadcastState() {
  io.to('admin').emit('admin:state', {
    phase: state.phase,
    currentQuestion: state.currentQuestion,
    totalQuestions: QUESTIONS.length,
    players: publicPlayers(),
    question: state.currentQuestion >= 0 ? QUESTIONS[state.currentQuestion] : null,
  });
}

function startQuestion(index) {
  if (index >= QUESTIONS.length) {
    state.phase = 'finished';
    broadcastState();
    io.emit('game:finished', { leaderboard: publicPlayers() });
    return;
  }
  state.currentQuestion = index;
  state.phase = 'question';
  state.questionStartedAt = Date.now();
  for (const p of state.players.values()) p.answered = false;

  const q = QUESTIONS[index];
  io.emit('question:start', {
    index,
    total: QUESTIONS.length,
    question: q.question,
    answers: q.answers,
    timeMs: q.timeMs,
  });
  broadcastState();

  if (state.questionTimer) clearTimeout(state.questionTimer);
  state.questionTimer = setTimeout(() => revealAnswer(), q.timeMs);
}

function revealAnswer() {
  if (state.questionTimer) {
    clearTimeout(state.questionTimer);
    state.questionTimer = null;
  }
  state.phase = 'reveal';
  const q = QUESTIONS[state.currentQuestion];
  io.emit('question:reveal', {
    correct: q.correct,
    leaderboard: publicPlayers(),
  });
  broadcastState();
}

io.on('connection', (socket) => {
  socket.on('player:join', (name, ack) => {
    const clean = String(name || '').trim().slice(0, 20);
    if (!clean) {
      if (ack) ack({ ok: false, error: 'Bitte einen Vornamen eingeben.' });
      return;
    }
    if (state.phase !== 'lobby') {
      if (ack) ack({ ok: false, error: 'Spiel hat bereits begonnen.' });
      return;
    }
    const taken = Array.from(state.players.values()).some(p => p.name.toLowerCase() === clean.toLowerCase());
    if (taken) {
      if (ack) ack({ ok: false, error: 'Name bereits vergeben.' });
      return;
    }
    state.players.set(socket.id, { name: clean, score: 0, answered: false });
    if (ack) ack({ ok: true, name: clean });
    io.emit('lobby:update', publicPlayers());
    broadcastState();
  });

  socket.on('player:answer', (choice, ack) => {
    const player = state.players.get(socket.id);
    if (!player) return;
    if (state.phase !== 'question') return;
    if (player.answered) return;
    const q = QUESTIONS[state.currentQuestion];
    if (typeof choice !== 'number' || choice < 0 || choice >= q.answers.length) return;

    player.answered = true;
    const elapsed = Date.now() - state.questionStartedAt;
    const correct = choice === q.correct;
    let points = 0;
    if (correct) {
      const ratio = Math.max(0, 1 - elapsed / q.timeMs);
      points = Math.round(500 + 500 * ratio);
      player.score += points;
    }
    if (ack) ack({ correct, points });
    broadcastState();

    const allAnswered = Array.from(state.players.values()).every(p => p.answered);
    if (allAnswered && state.players.size > 0) {
      revealAnswer();
    }
  });

  socket.on('admin:join', () => {
    socket.join('admin');
    broadcastState();
  });

  socket.on('admin:start', () => {
    if (state.phase !== 'lobby') return;
    if (state.players.size === 0) return;
    startQuestion(0);
  });

  socket.on('admin:next', () => {
    if (state.phase === 'reveal') {
      startQuestion(state.currentQuestion + 1);
    } else if (state.phase === 'question') {
      revealAnswer();
    }
  });

  socket.on('admin:reset', () => {
    if (state.questionTimer) clearTimeout(state.questionTimer);
    state.phase = 'lobby';
    state.currentQuestion = -1;
    state.players.clear();
    io.emit('game:reset');
    broadcastState();
  });

  socket.on('disconnect', () => {
    if (state.players.has(socket.id)) {
      state.players.delete(socket.id);
      io.emit('lobby:update', publicPlayers());
      broadcastState();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Kahoot-Clone läuft auf http://localhost:${PORT}`);
  console.log(`Admin-View:   http://localhost:${PORT}/admin.html`);
});
