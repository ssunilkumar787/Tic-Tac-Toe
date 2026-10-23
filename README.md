# Tic Tac Toe (React)

## Overview
Browser Tic Tac Toe with two-player and computer modes, move history, undo, and a session scoreboard. React only, no server. `src/api.js` is a local service module that owns all game state and **saves it to the browser's localStorage**, so the current game and scoreboard survive a refresh. Its functions mirror the suggested REST contract, and the UI only renders what the service returns.

## Tech stack
React 18, Vite, Vitest. Storage: browser localStorage (key `tictactoe-state-v1`).

## Features
3x3 board with locked cells, turn display, win/draw detection with highlighted cells, Reset Game, move history, mode-aware Undo, scoreboard with separate reset, computer opponent (win > block > center > corner > any).

## Run
```
npm install
npm run dev      # http://localhost:5173
npm test
```

## Structure
- `src/gameLogic.js` pure rules (move validation, win/draw, undo, computer move)
- `src/api.js` session state, move history, scoreboard; function names mirror the REST endpoints below
- `src/App.jsx` UI; `src/game.test.js` unit tests

## API contract (service functions, REST-shaped)
| REST | Function | Purpose |
|---|---|---|
| POST /api/games | createGame(mode) | New game (`TwoPlayer` or `Computer`) |
| GET /api/games/{id} | getGame(id) | Current state |
| POST /api/games/{id}/moves | submitMove(id, player, index) | Move, index 0-8 |
| POST /api/games/{id}/undo | undoMove(id) | Undo |
| POST /api/games/{id}/reset | resetGame(id) | Fresh game, same mode |
| GET /api/scoreboard | getScoreboard() | `{xWins,oWins,draws}` |
| POST /api/scoreboard/reset | resetScoreboard() | Zero totals |

State: `{id, mode, board, currentPlayer, status (InProgress|Won|Draw), winner, winningCells, history:[{move,player,index}], scoreboard}`.
Errors (thrown `GameError.code`): `OUT_OF_BOUNDS`, `OCCUPIED`, `GAME_OVER`, `WRONG_PLAYER`, `CANNOT_UNDO`, `NOT_FOUND`.

## Design decisions
- Rules are pure functions, separate from state, so they are easy to test and to port to C#.
- **Undo uses Option A**: disabled once a game is won or drawn, so the scoreboard is always final and counted once.
- Computer replies inside the same `submitMove` call, so state is never half-updated.
- Switching mode starts a new game; the scoreboard persists.

## Assumptions
Human is X, computer is O. Data is per browser and per device; clearing site data erases it.

## Known limitations
No server or cross-device sync, no .NET backend, no component tests, unbeatable-AI not a goal (fixed heuristic).

## Future improvements
Swap `api.js` for `fetch` calls to a real API, add React Testing Library tests.

## AI tools and prompt summary
_Fill in before submission: the tool used, the prompts, what you changed by hand, and what you reviewed most carefully._
