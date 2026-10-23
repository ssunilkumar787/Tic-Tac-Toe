import { describe, it, expect, beforeEach, vi } from 'vitest';
import { newGame, makeMove, undo, canUndo, computerMove, evaluate, GameError } from './gameLogic.js';
import * as api from './api.js';

const play = (g, ...cells) => cells.reduce((s, c) => makeMove(s, s.currentPlayer, c), g);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } };

describe('moves and turns', () => {
  it('accepts a valid move and switches turn', () => {
    const g = makeMove(newGame('1'), 'X', 4);
    expect(g.board[4]).toBe('X'); expect(g.currentPlayer).toBe('O'); expect(g.history).toHaveLength(1);
  });
  it('rejects invalid moves without changing the turn', () => {
    const g = play(newGame('1'), 0);
    expect(code(() => makeMove(g, 'O', 0))).toBe('OCCUPIED');
    expect(code(() => makeMove(g, 'O', 9))).toBe('OUT_OF_BOUNDS');
    expect(code(() => makeMove(g, 'X', 1))).toBe('WRONG_PLAYER');
    expect(g.currentPlayer).toBe('O');
  });
});

describe('win and draw', () => {
  it('detects a row win', () => { const g = play(newGame('1'), 0, 3, 1, 4, 2); expect(g).toMatchObject({ status: 'Won', winner: 'X', winningCells: [0, 1, 2] }); });
  it('detects a column win', () => { expect(play(newGame('1'), 0, 1, 3, 2, 6).winningCells).toEqual([0, 3, 6]); });
  it('detects a diagonal win', () => { expect(play(newGame('1'), 0, 1, 4, 2, 8).winningCells).toEqual([0, 4, 8]); });
  it('detects a draw', () => { expect(play(newGame('1'), 0, 1, 2, 4, 3, 5, 7, 6, 8).status).toBe('Draw'); });
  it('rejects moves after completion', () => {
    const g = play(newGame('1'), 0, 3, 1, 4, 2);
    expect(code(() => makeMove(g, 'O', 8))).toBe('GAME_OVER');
  });
});

describe('undo', () => {
  it('removes one move in two-player mode', () => {
    const g = undo(play(newGame('1'), 0, 4));
    expect(g.board[4]).toBeNull(); expect(g.currentPlayer).toBe('O'); expect(g.history).toHaveLength(1);
  });
  it('removes the computer move and the human move together', () => {
    const g = makeMove(newGame('1', 'Computer'), 'X', 0);
    expect(g.history).toHaveLength(2);
    const u = undo(g);
    expect(u.history).toHaveLength(0); expect(u.currentPlayer).toBe('X'); expect(u.board.every((c) => c === null)).toBe(true);
  });
  it('is disabled with no moves and after completion (Option A)', () => {
    expect(canUndo(newGame('1'))).toBe(false);
    expect(canUndo(play(newGame('1'), 0, 3, 1, 4, 2))).toBe(false);
  });
});

describe('computer selection', () => {
  const b = (s) => [...s].map((c) => (c === '.' ? null : c));
  it('wins first', () => { expect(computerMove(b('OO.XX....'))).toBe(2); });
  it('blocks X', () => { expect(computerMove(b('XX.......'))).toBe(2); });
  it('takes center, then corner, then any', () => {
    expect(computerMove(b('X........'))).toBe(4);
    expect(computerMove(b('....X....'))).toBe(0);
    expect(computerMove(b('XOXOXOO.O'))).toBe(7);
  });
  it('never plays an occupied cell', () => {
    let g = newGame('1', 'Computer');
    g = makeMove(g, 'X', 0);
    expect(new Set(g.board.filter(Boolean)).size).toBe(2);
  });
});

describe('session: reset and scoreboard', () => {
  beforeEach(() => api.resetAll());
  it('updates the scoreboard once per completed game', () => {
    let g = api.createGame();
    [0, 3, 1, 4, 2].forEach((c) => { g = api.submitMove(g.id, g.currentPlayer, c); });
    expect(g.scoreboard).toEqual({ xWins: 1, oWins: 0, draws: 0 });
    expect(() => api.submitMove(g.id, 'O', 8)).toThrow(GameError);
    expect(api.getScoreboard().xWins).toBe(1);
  });
  it('records draws', () => {
    let g = api.createGame();
    [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((c) => { g = api.submitMove(g.id, g.currentPlayer, c); });
    expect(api.getScoreboard().draws).toBe(1);
  });
  it('reset game clears state but keeps the scoreboard', () => {
    let g = api.createGame();
    [0, 3, 1, 4, 2].forEach((c) => { g = api.submitMove(g.id, g.currentPlayer, c); });
    g = api.resetGame(g.id);
    expect(g).toMatchObject({ status: 'InProgress', currentPlayer: 'X', history: [] });
    expect(g.scoreboard.xWins).toBe(1);
  });
  it('reset scoreboard zeroes the totals', () => {
    let g = api.createGame();
    [0, 3, 1, 4, 2].forEach((c) => { g = api.submitMove(g.id, g.currentPlayer, c); });
    expect(api.resetScoreboard()).toEqual({ xWins: 0, oWins: 0, draws: 0 });
  });
});

describe('local persistence', () => {
  it('restores games and scoreboard from localStorage', () => {
    const store = {};
    vi.stubGlobal('localStorage', { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } });
    api.resetAll();
    let g = api.createGame();
    [0, 3, 1, 4, 2].forEach((c) => { g = api.submitMove(g.id, g.currentPlayer, c); });
    api._clearMemory();            // simulate a page refresh
    api.loadFromStorage();
    expect(api.resumeGame()).toMatchObject({ id: g.id, status: 'Won', scoreboard: { xWins: 1 } });
    vi.unstubAllGlobals();
  });
});
