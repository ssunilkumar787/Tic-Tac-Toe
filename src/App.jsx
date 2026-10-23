import { useEffect, useState } from 'react';
import * as api from './api.js';
import { canUndo } from './gameLogic.js';

const pos = (i) => `Row ${Math.floor(i / 3) + 1}, Column ${(i % 3) + 1}`;

export default function App() {
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { setGame(api.resumeGame()); }, []);
  if (!game) return null;

  const run = (fn) => {
    try { setGame(fn()); setError(''); } catch (e) { setError(e.message); }
  };
  const changeMode = (mode) => run(() => api.createGame(mode));

  const banner =
    game.status === 'Won' ? `${game.winner} wins` :
    game.status === 'Draw' ? "It's a draw" :
    `${game.currentPlayer}'s turn`;

  return (
    <main className="app">
      <h1>Tic Tac Toe</h1>
      <div className="modes" role="group" aria-label="Game mode">
        {[['TwoPlayer', 'Two players'], ['Computer', 'Play the computer']].map(([m, label]) => (
          <button key={m} className={game.mode === m ? 'on' : ''} onClick={() => changeMode(m)}>{label}</button>
        ))}
      </div>

      <section className="play">
        <div>
          <p className={`banner ${game.status}`} aria-live="polite">{banner}</p>
          <div className="board">
            {game.board.map((v, i) => (
              <button key={i} aria-label={`${pos(i)}${v ? `, ${v}` : ''}`}
                className={`cell ${v || ''} ${game.winningCells.includes(i) ? 'win' : ''}`}
                disabled={!!v || game.status !== 'InProgress'}
                onClick={() => run(() => api.submitMove(game.id, game.currentPlayer, i))}>{v}</button>
            ))}
          </div>
          <p className="error" role="alert">{error}</p>
          <div className="actions">
            <button onClick={() => run(() => api.undoMove(game.id))} disabled={!canUndo(game)}>Undo last move</button>
            <button onClick={() => run(() => api.resetGame(game.id))}>Reset game</button>
          </div>
        </div>

        <aside>
          <h2>Scoreboard</h2>
          <dl className="score">
            <div><dt>X</dt><dd>{game.scoreboard.xWins}</dd></div>
            <div><dt>O</dt><dd>{game.scoreboard.oWins}</dd></div>
            <div><dt>Draws</dt><dd>{game.scoreboard.draws}</dd></div>
          </dl>
          <button className="link" onClick={() => { api.resetScoreboard(); run(() => api.getGame(game.id)); }}>Reset scoreboard</button>

          <h2>Move history</h2>
          {game.history.length === 0 ? <p className="muted">No moves yet. Pick a cell to start.</p> : (
            <table>
              <thead><tr><th>Move</th><th>Player</th><th>Position</th></tr></thead>
              <tbody>{game.history.map((h) => (
                <tr key={h.move}><td>{h.move}</td><td>{h.player}</td><td>{pos(h.index)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </aside>
      </section>
    </main>
  );
}
