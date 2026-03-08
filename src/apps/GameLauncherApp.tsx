import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Gamepad2, Trophy, RotateCw } from 'lucide-react';

/* ── 2048 Game ── */
type Grid = number[][];
const SIZE = 4;
const empty = (): Grid => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
const addRandom = (g: Grid): Grid => {
  const clone = g.map(r => [...r]);
  const empties: [number, number][] = [];
  clone.forEach((r, ri) => r.forEach((c, ci) => { if (c === 0) empties.push([ri, ci]); }));
  if (empties.length === 0) return clone;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  clone[r][c] = Math.random() < 0.9 ? 2 : 4;
  return clone;
};
const slide = (row: number[]): [number[], number] => {
  let score = 0;
  const filtered = row.filter(x => x !== 0);
  const merged: number[] = [];
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2); score += filtered[i] * 2; i++;
    } else merged.push(filtered[i]);
  }
  while (merged.length < SIZE) merged.push(0);
  return [merged, score];
};
const moveGrid = (g: Grid, dir: 'left' | 'right' | 'up' | 'down'): [Grid, number] => {
  let total = 0;
  let rows = g.map(r => [...r]);
  if (dir === 'up' || dir === 'down') {
    rows = Array.from({ length: SIZE }, (_, c) => rows.map(r => r[c]));
  }
  if (dir === 'right' || dir === 'down') rows = rows.map(r => r.reverse());
  rows = rows.map(r => { const [nr, s] = slide(r); total += s; return nr; });
  if (dir === 'right' || dir === 'down') rows = rows.map(r => r.reverse());
  if (dir === 'up' || dir === 'down') {
    const t = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    rows.forEach((r, ri) => r.forEach((v, ci) => { t[ci][ri] = v; }));
    return [t, total];
  }
  return [rows, total];
};
const TILE_COLORS: Record<number, string> = {
  2: 'bg-amber-100 text-amber-900', 4: 'bg-amber-200 text-amber-900', 8: 'bg-orange-400 text-white',
  16: 'bg-orange-500 text-white', 32: 'bg-red-400 text-white', 64: 'bg-red-500 text-white',
  128: 'bg-yellow-400 text-white', 256: 'bg-yellow-500 text-white', 512: 'bg-yellow-600 text-white',
  1024: 'bg-yellow-700 text-white', 2048: 'bg-primary text-primary-foreground',
};

/* ── Minesweeper ── */
const MS = 9; const MINES = 10;
type MCell = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number; };
const createBoard = (): MCell[][] => {
  const b: MCell[][] = Array.from({ length: MS }, () => Array.from({ length: MS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * MS), c = Math.floor(Math.random() * MS);
    if (!b[r][c].mine) { b[r][c].mine = true; placed++; }
  }
  for (let r = 0; r < MS; r++) for (let c = 0; c < MS; c++) {
    if (b[r][c].mine) continue;
    let cnt = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < MS && nc >= 0 && nc < MS && b[nr][nc].mine) cnt++;
    }
    b[r][c].adjacent = cnt;
  }
  return b;
};
const ADJ_COLORS = ['', 'text-blue-400', 'text-green-400', 'text-red-400', 'text-purple-400', 'text-orange-400', 'text-cyan-400', 'text-pink-400', 'text-gray-400'];

export default function GameLauncherApp({ windowId }: { windowId: string }) {
  const [game, setGame] = useState<'menu' | '2048' | 'minesweeper'>('menu');

  // 2048 state
  const [grid, setGrid] = useState<Grid>(() => addRandom(addRandom(empty())));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('2048-best') || '0'));

  // Minesweeper state
  const [board, setBoard] = useState(createBoard);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const reset2048 = () => { setGrid(addRandom(addRandom(empty()))); setScore(0); };
  const resetMine = () => { setBoard(createBoard()); setGameOver(false); setWon(false); };

  useEffect(() => {
    if (game !== '2048') return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      const dir = map[e.key]; if (!dir) return;
      e.preventDefault();
      setGrid(prev => {
        const [next, pts] = moveGrid(prev, dir);
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
        setScore(s => { const ns = s + pts; if (ns > bestScore) { setBestScore(ns); localStorage.setItem('2048-best', `${ns}`); } return ns; });
        return addRandom(next);
      });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [game, bestScore]);

  const revealCell = (r: number, c: number) => {
    if (gameOver || won) return;
    setBoard(prev => {
      const b = prev.map(row => row.map(cell => ({ ...cell })));
      if (b[r][c].flagged || b[r][c].revealed) return prev;
      if (b[r][c].mine) { setGameOver(true); b.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true; })); return b; }
      const flood = (r: number, c: number) => {
        if (r < 0 || r >= MS || c < 0 || c >= MS || b[r][c].revealed || b[r][c].mine) return;
        b[r][c].revealed = true;
        if (b[r][c].adjacent === 0) { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) flood(r + dr, c + dc); }
      };
      flood(r, c);
      const unrevealed = b.flat().filter(c => !c.revealed && !c.mine).length;
      if (unrevealed === 0) setWon(true);
      return b;
    });
  };

  const flagCell = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won) return;
    setBoard(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c && !cell.revealed ? { ...cell, flagged: !cell.flagged } : cell)));
  };

  if (game === 'menu') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[hsl(var(--os-window-body))] gap-4">
        <Gamepad2 size={40} className="text-primary" />
        <div className="text-lg font-bold text-foreground">Game Launcher</div>
        <div className="flex flex-col gap-2 w-48">
          <button onClick={() => { reset2048(); setGame('2048'); }} className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:opacity-90">🎲 2048</button>
          <button onClick={() => { resetMine(); setGame('minesweeper'); }} className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:opacity-90">💣 Minesweeper</button>
        </div>
      </div>
    );
  }

  if (game === '2048') {
    return (
      <div className="h-full flex flex-col items-center bg-[hsl(var(--os-window-body))] p-4">
        <div className="flex items-center gap-4 mb-3 w-full max-w-[280px]">
          <button onClick={() => setGame('menu')} className="text-[10px] text-muted-foreground hover:text-foreground">← Back</button>
          <div className="flex-1" />
          <div className="text-center"><div className="text-[9px] text-muted-foreground">SCORE</div><div className="text-sm font-bold text-foreground">{score}</div></div>
          <div className="text-center"><div className="text-[9px] text-muted-foreground">BEST</div><div className="text-sm font-bold text-primary">{bestScore}</div></div>
          <button onClick={reset2048} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><RotateCw size={14} /></button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 bg-muted/40 p-2 rounded-lg">
          {grid.map((row, ri) => row.map((val, ci) => (
            <div key={`${ri}-${ci}`}
              className={`w-14 h-14 rounded-md flex items-center justify-center font-bold text-sm transition-all ${val ? (TILE_COLORS[val] || 'bg-primary text-primary-foreground') : 'bg-secondary/30'}`}>
              {val || ''}
            </div>
          )))}
        </div>
        <div className="text-[10px] text-muted-foreground mt-3">Use arrow keys to play</div>
      </div>
    );
  }

  // Minesweeper
  return (
    <div className="h-full flex flex-col items-center bg-[hsl(var(--os-window-body))] p-4">
      <div className="flex items-center gap-4 mb-3 w-full max-w-[280px]">
        <button onClick={() => setGame('menu')} className="text-[10px] text-muted-foreground hover:text-foreground">← Back</button>
        <div className="flex-1 text-center">
          {gameOver && <span className="text-xs text-destructive font-medium">💥 Game Over</span>}
          {won && <span className="text-xs text-primary font-medium">🎉 You Win!</span>}
        </div>
        <div className="text-[10px] text-muted-foreground">💣 {MINES - board.flat().filter(c => c.flagged).length}</div>
        <button onClick={resetMine} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><RotateCw size={14} /></button>
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${MS}, minmax(0, 1fr))` }}>
        {board.map((row, ri) => row.map((cell, ci) => (
          <button key={`${ri}-${ci}`}
            onClick={() => revealCell(ri, ci)}
            onContextMenu={e => flagCell(e, ri, ci)}
            className={`w-7 h-7 text-[11px] font-bold rounded-sm flex items-center justify-center transition-colors ${
              cell.revealed ? (cell.mine ? 'bg-destructive/30' : 'bg-muted/20') : 'bg-secondary/40 hover:bg-secondary/60 active:bg-secondary/80'
            } ${cell.revealed && !cell.mine ? ADJ_COLORS[cell.adjacent] : ''}`}>
            {cell.flagged && !cell.revealed ? '🚩' : cell.revealed ? (cell.mine ? '💣' : (cell.adjacent || '')) : ''}
          </button>
        )))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-3">Left-click: reveal • Right-click: flag</div>
    </div>
  );
}
