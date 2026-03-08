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
  if (dir === 'up' || dir === 'down') rows = Array.from({ length: SIZE }, (_, c) => rows.map(r => r[c]));
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

/* ── Snake ── */
const SNAKE_SIZE = 15;
type Pos = { x: number; y: number };
const randFood = (snake: Pos[]): Pos => {
  let p: Pos;
  do { p = { x: Math.floor(Math.random() * SNAKE_SIZE), y: Math.floor(Math.random() * SNAKE_SIZE) }; }
  while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
};

/* ── Tetris ── */
const TW = 10, TH = 20;
const TETRO: number[][][] = [
  [[1,1,1,1]], // I
  [[1,1],[1,1]], // O
  [[0,1,0],[1,1,1]], // T
  [[1,0],[1,0],[1,1]], // L
  [[0,1],[0,1],[1,1]], // J
  [[0,1,1],[1,1,0]], // S
  [[1,1,0],[0,1,1]], // Z
];
const TETRO_COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

export default function GameLauncherApp({ windowId }: { windowId: string }) {
  const [game, setGame] = useState<'menu' | '2048' | 'minesweeper' | 'snake' | 'tetris'>('menu');

  // 2048
  const [grid, setGrid] = useState<Grid>(() => addRandom(addRandom(empty())));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('2048-best') || '0'));

  // Minesweeper
  const [board, setBoard] = useState(createBoard);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Snake
  const [snake, setSnake] = useState<Pos[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Pos>({ x: 3, y: 3 });
  const [snakeDir, setSnakeDir] = useState<'up' | 'down' | 'left' | 'right'>('right');
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeRunning, setSnakeRunning] = useState(false);
  const [snakeDead, setSnakeDead] = useState(false);
  const snakeDirRef = useRef(snakeDir);
  snakeDirRef.current = snakeDir;

  // Tetris
  const [tetBoard, setTetBoard] = useState<(string | null)[][]>(() => Array.from({ length: TH }, () => Array(TW).fill(null)));
  const [tetPiece, setTetPiece] = useState<{ shape: number[][]; color: string; x: number; y: number } | null>(null);
  const [tetScore, setTetScore] = useState(0);
  const [tetOver, setTetOver] = useState(false);
  const [tetRunning, setTetRunning] = useState(false);
  const tetBoardRef = useRef(tetBoard);
  tetBoardRef.current = tetBoard;
  const tetPieceRef = useRef(tetPiece);
  tetPieceRef.current = tetPiece;

  const reset2048 = () => { setGrid(addRandom(addRandom(empty()))); setScore(0); };
  const resetMine = () => { setBoard(createBoard()); setGameOver(false); setWon(false); };
  const resetSnake = () => { setSnake([{ x: 7, y: 7 }]); setFood({ x: 3, y: 3 }); setSnakeDir('right'); setSnakeScore(0); setSnakeDead(false); setSnakeRunning(true); };
  const resetTetris = () => { setTetBoard(Array.from({ length: TH }, () => Array(TW).fill(null))); setTetPiece(null); setTetScore(0); setTetOver(false); setTetRunning(true); };

  // 2048 keys
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

  // Snake game loop
  useEffect(() => {
    if (game !== 'snake' || !snakeRunning || snakeDead) return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      const opp: Record<string, string> = { up: 'down', down: 'up', left: 'right', right: 'left' };
      if (opp[d] !== snakeDirRef.current) setSnakeDir(d);
    };
    window.addEventListener('keydown', handler);

    const tick = setInterval(() => {
      setSnake(prev => {
        const head = { ...prev[0] };
        const d = snakeDirRef.current;
        if (d === 'up') head.y--;
        if (d === 'down') head.y++;
        if (d === 'left') head.x--;
        if (d === 'right') head.x++;

        if (head.x < 0 || head.x >= SNAKE_SIZE || head.y < 0 || head.y >= SNAKE_SIZE || prev.some(s => s.x === head.x && s.y === head.y)) {
          setSnakeDead(true); setSnakeRunning(false); return prev;
        }

        const newSnake = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setSnakeScore(s => s + 10);
          setFood(randFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 120);

    return () => { clearInterval(tick); window.removeEventListener('keydown', handler); };
  }, [game, snakeRunning, snakeDead, food]);

  // Tetris
  const spawnPiece = useCallback(() => {
    const idx = Math.floor(Math.random() * TETRO.length);
    return { shape: TETRO[idx], color: TETRO_COLORS[idx], x: Math.floor((TW - TETRO[idx][0].length) / 2), y: 0 };
  }, []);

  const canPlace = useCallback((board: (string | null)[][], shape: number[][], x: number, y: number) => {
    for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const ny = y + r, nx = x + c;
      if (nx < 0 || nx >= TW || ny >= TH) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
    return true;
  }, []);

  const placePiece = useCallback((board: (string | null)[][], piece: { shape: number[][]; color: string; x: number; y: number }) => {
    const b = board.map(r => [...r]);
    piece.shape.forEach((row, r) => row.forEach((v, c) => {
      if (v && piece.y + r >= 0) b[piece.y + r][piece.x + c] = piece.color;
    }));
    return b;
  }, []);

  const clearLines = useCallback((board: (string | null)[][]) => {
    let cleared = 0;
    const b = board.filter(row => { if (row.every(c => c !== null)) { cleared++; return false; } return true; });
    while (b.length < TH) b.unshift(Array(TW).fill(null));
    return { board: b, cleared };
  }, []);

  useEffect(() => {
    if (game !== 'tetris' || !tetRunning || tetOver) return;
    if (!tetPiece) { const p = spawnPiece(); if (!canPlace(tetBoard, p.shape, p.x, p.y)) { setTetOver(true); return; } setTetPiece(p); return; }

    const handler = (e: KeyboardEvent) => {
      const p = tetPieceRef.current;
      const b = tetBoardRef.current;
      if (!p) return;
      if (e.key === 'ArrowLeft' && canPlace(b, p.shape, p.x - 1, p.y)) { setTetPiece({ ...p, x: p.x - 1 }); e.preventDefault(); }
      if (e.key === 'ArrowRight' && canPlace(b, p.shape, p.x + 1, p.y)) { setTetPiece({ ...p, x: p.x + 1 }); e.preventDefault(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); } // handled by tick
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const rotated = p.shape[0].map((_, ci) => p.shape.map(row => row[ci]).reverse());
        if (canPlace(b, rotated, p.x, p.y)) setTetPiece({ ...p, shape: rotated });
      }
    };
    window.addEventListener('keydown', handler);

    const tick = setInterval(() => {
      setTetPiece(prev => {
        if (!prev) return prev;
        if (canPlace(tetBoardRef.current, prev.shape, prev.x, prev.y + 1)) return { ...prev, y: prev.y + 1 };
        // Lock piece
        const newBoard = placePiece(tetBoardRef.current, prev);
        const { board: cleared, cleared: lines } = clearLines(newBoard);
        setTetBoard(cleared);
        setTetScore(s => s + lines * 100 + 10);
        setTetPiece(null); // Will spawn next
        return null;
      });
    }, 500);

    return () => { clearInterval(tick); window.removeEventListener('keydown', handler); };
  }, [game, tetRunning, tetOver, tetPiece, tetBoard, spawnPiece, canPlace, placePiece, clearLines]);

  // Minesweeper
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
      if (b.flat().filter(c => !c.revealed && !c.mine).length === 0) setWon(true);
      return b;
    });
  };

  const flagCell = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won) return;
    setBoard(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c && !cell.revealed ? { ...cell, flagged: !cell.flagged } : cell)));
  };

  // Render tetris board with current piece
  const renderTetBoard = () => {
    const display = tetBoard.map(r => [...r]);
    if (tetPiece) {
      tetPiece.shape.forEach((row, r) => row.forEach((v, c) => {
        if (v && tetPiece.y + r >= 0 && tetPiece.y + r < TH) display[tetPiece.y + r][tetPiece.x + c] = tetPiece.color;
      }));
    }
    return display;
  };

  if (game === 'menu') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[hsl(var(--os-window-body))] gap-4 p-4">
        <Gamepad2 size={40} className="text-primary" />
        <div className="text-lg font-bold text-foreground">Game Launcher</div>
        <div className="grid grid-cols-2 gap-2 w-64">
          <button onClick={() => { reset2048(); setGame('2048'); }} className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:opacity-90">🎲 2048</button>
          <button onClick={() => { resetMine(); setGame('minesweeper'); }} className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:opacity-90">💣 Minesweeper</button>
          <button onClick={() => { resetSnake(); setGame('snake'); }} className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:opacity-90">🐍 Snake</button>
          <button onClick={() => { resetTetris(); setGame('tetris'); }} className="px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90">🧱 Tetris</button>
        </div>
        <div className="text-[10px] text-muted-foreground mt-2">Use arrow keys to play</div>
      </div>
    );
  }

  const BackButton = ({ onReset }: { onReset: () => void }) => (
    <div className="flex items-center gap-4 mb-3 w-full max-w-[280px]">
      <button onClick={() => setGame('menu')} className="text-[10px] text-muted-foreground hover:text-foreground">← Back</button>
      <div className="flex-1" />
      <button onClick={onReset} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><RotateCw size={14} /></button>
    </div>
  );

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
            <div key={`${ri}-${ci}`} className={`w-14 h-14 rounded-md flex items-center justify-center font-bold text-sm transition-all ${val ? (TILE_COLORS[val] || 'bg-primary text-primary-foreground') : 'bg-secondary/30'}`}>{val || ''}</div>
          )))}
        </div>
        <div className="text-[10px] text-muted-foreground mt-3">Use arrow keys to play</div>
      </div>
    );
  }

  if (game === 'minesweeper') {
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
            <button key={`${ri}-${ci}`} onClick={() => revealCell(ri, ci)} onContextMenu={e => flagCell(e, ri, ci)}
              className={`w-7 h-7 text-[11px] font-bold rounded-sm flex items-center justify-center transition-colors ${cell.revealed ? (cell.mine ? 'bg-destructive/30' : 'bg-muted/20') : 'bg-secondary/40 hover:bg-secondary/60 active:bg-secondary/80'} ${cell.revealed && !cell.mine ? ADJ_COLORS[cell.adjacent] : ''}`}>
              {cell.flagged && !cell.revealed ? '🚩' : cell.revealed ? (cell.mine ? '💣' : (cell.adjacent || '')) : ''}
            </button>
          )))}
        </div>
        <div className="text-[10px] text-muted-foreground mt-3">Left-click: reveal • Right-click: flag</div>
      </div>
    );
  }

  if (game === 'snake') {
    return (
      <div className="h-full flex flex-col items-center bg-[hsl(var(--os-window-body))] p-4">
        <div className="flex items-center gap-4 mb-3 w-full max-w-[280px]">
          <button onClick={() => { setSnakeRunning(false); setGame('menu'); }} className="text-[10px] text-muted-foreground hover:text-foreground">← Back</button>
          <div className="flex-1 text-center">
            {snakeDead && <span className="text-xs text-destructive font-medium">💀 Game Over</span>}
          </div>
          <div className="text-[10px] text-foreground font-bold">Score: {snakeScore}</div>
          <button onClick={resetSnake} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><RotateCw size={14} /></button>
        </div>
        <div className="grid gap-[1px] bg-muted/20 p-1 rounded-lg" style={{ gridTemplateColumns: `repeat(${SNAKE_SIZE}, 18px)` }}>
          {Array.from({ length: SNAKE_SIZE }, (_, y) =>
            Array.from({ length: SNAKE_SIZE }, (_, x) => {
              const isHead = snake[0]?.x === x && snake[0]?.y === y;
              const isBody = snake.some((s, i) => i > 0 && s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;
              return (
                <div key={`${x}-${y}`} className={`w-[18px] h-[18px] rounded-sm transition-colors ${
                  isHead ? 'bg-primary' : isBody ? 'bg-primary/60' : isFood ? 'bg-destructive' : 'bg-secondary/20'
                }`} />
              );
            })
          )}
        </div>
        {!snakeRunning && !snakeDead && <button onClick={resetSnake} className="mt-3 px-4 py-1.5 bg-primary/20 text-primary rounded text-xs">Start</button>}
        <div className="text-[10px] text-muted-foreground mt-3">Use arrow keys to move</div>
      </div>
    );
  }

  // Tetris
  const display = renderTetBoard();
  return (
    <div className="h-full flex flex-col items-center bg-[hsl(var(--os-window-body))] p-4">
      <div className="flex items-center gap-4 mb-3 w-full max-w-[280px]">
        <button onClick={() => { setTetRunning(false); setGame('menu'); }} className="text-[10px] text-muted-foreground hover:text-foreground">← Back</button>
        <div className="flex-1 text-center">
          {tetOver && <span className="text-xs text-destructive font-medium">💥 Game Over</span>}
        </div>
        <div className="text-[10px] text-foreground font-bold">Score: {tetScore}</div>
        <button onClick={resetTetris} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><RotateCw size={14} /></button>
      </div>
      <div className="border border-border/30 rounded overflow-hidden">
        {display.map((row, ri) => (
          <div key={ri} className="flex">
            {row.map((cell, ci) => (
              <div key={ci} className="w-[14px] h-[14px] border border-border/5" style={{ backgroundColor: cell || 'hsl(var(--secondary) / 0.15)' }} />
            ))}
          </div>
        ))}
      </div>
      {!tetRunning && !tetOver && <button onClick={resetTetris} className="mt-3 px-4 py-1.5 bg-primary/20 text-primary rounded text-xs">Start</button>}
      <div className="text-[10px] text-muted-foreground mt-3">← → Move • ↑ Rotate • ↓ Drop</div>
    </div>
  );
}
