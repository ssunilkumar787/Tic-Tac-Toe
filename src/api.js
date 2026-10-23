// Local "backend": owns all game state and persists it to the browser's localStorage,
// so games and the scoreboard survive a page refresh. No server involved.
import { newGame, makeMove, undo, GameError } from './gameLogic.js';

const KEY = 'tictactoe-state-v1';
const emptyScore = () => ({ xWins: 0, oWins: 0, draws: 0 });
let state = { games: {}, scoreboard: emptyScore(), nextId: 1, lastGameId: null };

export function loadFromStorage() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch { /* corrupt or unavailable storage: start fresh */ }
}
function save() {
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}
loadFromStorage();

export function _clearMemory() { state = { games: {}, scoreboard: emptyScore(), nextId: 1, lastGameId: null }; }
export function resetAll() { _clearMemory(); save(); }

const get = (id) => {
  const g = state.games[id];
  if (!g) throw new GameError('NOT_FOUND', 'Game not found.');
  return g;
};
const respond = (game) => {
  state.games[game.id] = game; state.lastGameId = game.id; save();
  return { ...game, scoreboard: { ...state.scoreboard } };
};

export const createGame = (mode = 'TwoPlayer') => respond(newGame(String(state.nextId++), mode));
export const getGame = (id) => respond(get(id));
export const resumeGame = () => (state.games[state.lastGameId] ? getGame(state.lastGameId) : createGame());
export const getScoreboard = () => ({ ...state.scoreboard });

export function submitMove(id, player, index) {
  const next = makeMove(get(id), player, index);
  // A completed game rejects further moves, so this runs exactly once per game.
  if (next.status === 'Won') state.scoreboard[next.winner === 'X' ? 'xWins' : 'oWins']++;
  if (next.status === 'Draw') state.scoreboard.draws++;
  return respond(next);
}
export const undoMove = (id) => respond(undo(get(id)));
export const resetGame = (id) => { const g = get(id); return respond(newGame(g.id, g.mode)); };
export const resetScoreboard = () => { state.scoreboard = emptyScore(); save(); return getScoreboard(); };
