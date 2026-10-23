// Pure game rules: no I/O, no shared state. Easy to unit test.
export const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export const CORNERS = [0, 2, 6, 8];

export class GameError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export function evaluate(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { status: 'Won', winner: board[a], winningCells: line };
  }
  if (board.every(Boolean)) return { status: 'Draw', winner: null, winningCells: [] };
  return { status: 'InProgress', winner: null, winningCells: [] };
}

export function newGame(id, mode = 'TwoPlayer') {
  return { id, mode, board: Array(9).fill(null), currentPlayer: 'X', history: [], ...evaluate(Array(9).fill(null)) };
}

// Returns the cell O should take: win > block > center > corner > any.
export function computerMove(board, me = 'O', opponent = 'X') {
  const empty = board.map((v, i) => (v ? null : i)).filter((i) => i !== null);
  const completes = (player) => empty.find((i) => {
    const t = [...board]; t[i] = player;
    return evaluate(t).winner === player;
  });
  const win = completes(me); if (win !== undefined) return win;
  const block = completes(opponent); if (block !== undefined) return block;
  if (empty.includes(4)) return 4;
  const corner = CORNERS.find((c) => empty.includes(c)); if (corner !== undefined) return corner;
  return empty[0];
}

function place(game, player, index) {
  const board = [...game.board]; board[index] = player;
  const history = [...game.history, { move: game.history.length + 1, player, index }];
  const result = evaluate(board);
  return { ...game, board, history, ...result, currentPlayer: player === 'X' ? 'O' : 'X' };
}

export function makeMove(game, player, index) {
  if (game.status !== 'InProgress') throw new GameError('GAME_OVER', 'Game is already complete.');
  if (!Number.isInteger(index) || index < 0 || index > 8) throw new GameError('OUT_OF_BOUNDS', 'Cell is outside the board.');
  if (player !== game.currentPlayer) throw new GameError('WRONG_PLAYER', `It is ${game.currentPlayer}'s turn.`);
  if (game.board[index]) throw new GameError('OCCUPIED', 'Cell is already taken.');
  if (game.mode === 'Computer' && player !== 'X') throw new GameError('WRONG_PLAYER', 'O is played by the computer.');
  let next = place(game, player, index);
  if (game.mode === 'Computer' && next.status === 'InProgress') next = place(next, 'O', computerMove(next.board));
  return next;
}

export const canUndo = (game) => game.history.length > 0 && game.status === 'InProgress'; // Option A

export function undo(game) {
  if (!canUndo(game)) throw new GameError('CANNOT_UNDO', 'Nothing to undo.');
  const remove = game.mode === 'Computer' && game.history.length >= 2 ? 2 : 1;
  const history = game.history.slice(0, -remove);
  const board = Array(9).fill(null);
  history.forEach((h) => { board[h.index] = h.player; });
  const last = history[history.length - 1];
  return { ...game, board, history, currentPlayer: last ? (last.player === 'X' ? 'O' : 'X') : 'X', ...evaluate(board) };
}
