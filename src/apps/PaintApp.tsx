import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Pencil, Square, Circle, Minus, Eraser, Download, Trash2, Undo2, Redo2, Pipette, Type } from 'lucide-react';

type Tool = 'pencil' | 'rect' | 'circle' | 'line' | 'eraser' | 'fill' | 'picker' | 'text';

interface HistoryEntry { data: ImageData; }

const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
  '#ff00ff', '#00ffff', '#ff6600', '#9900ff', '#ff3366', '#33cc33',
  '#3366ff', '#ff9900', '#666666', '#cc6633',
];

export default function PaintApp({ windowId }: { windowId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const startPos = useRef({ x: 0, y: 0 });
  const previewRef = useRef<ImageData | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }, []);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const saveHistory = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      const next = [...prev.slice(0, historyIdx + 1), { data }];
      setHistoryIdx(next.length - 1);
      return next.slice(-50);
    });
  }, [historyIdx]);

  const undo = () => {
    if (historyIdx <= 0) return;
    const ctx = getCtx();
    if (!ctx) return;
    const newIdx = historyIdx - 1;
    ctx.putImageData(history[newIdx].data, 0, 0);
    setHistoryIdx(newIdx);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const ctx = getCtx();
    if (!ctx) return;
    const newIdx = historyIdx + 1;
    ctx.putImageData(history[newIdx].data, 0, 0);
    setHistoryIdx(newIdx);
  };

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;
    setDrawing(true);
    startPos.current = pos;

    if (tool === 'picker') {
      const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
      setColor(`#${[pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('')}`);
      setTool('pencil');
      return;
    }

    if (tool === 'fill') {
      floodFill(ctx, Math.round(pos.x), Math.round(pos.y), color);
      saveHistory();
      return;
    }

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#1a1a2e' : color;
      ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    if (['rect', 'circle', 'line'].includes(tool)) {
      previewRef.current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (['rect', 'circle', 'line'].includes(tool) && previewRef.current) {
      ctx.putImageData(previewRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      const sx = startPos.current.x, sy = startPos.current.y;
      if (tool === 'rect') {
        ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
        ctx.beginPath();
        ctx.ellipse(sx + (pos.x - sx) / 2, sy + (pos.y - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const onMouseUp = () => {
    if (!drawing) return;
    setDrawing(false);
    previewRef.current = null;
    saveHistory();
  };

  const clearCanvas = () => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'scribe-paint.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pencil', icon: <Pencil size={13} />, label: 'Pencil' },
    { id: 'line', icon: <Minus size={13} />, label: 'Line' },
    { id: 'rect', icon: <Square size={13} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={13} />, label: 'Circle' },
    { id: 'eraser', icon: <Eraser size={13} />, label: 'Eraser' },
    { id: 'picker', icon: <Pipette size={13} />, label: 'Color Picker' },
  ];

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/20 bg-secondary/10 flex-wrap">
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
            className={`p-1.5 rounded transition-colors ${tool === t.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'}`}>
            {t.icon}
          </button>
        ))}
        <div className="w-px h-5 bg-border/30 mx-1" />
        <button onClick={undo} title="Undo" className="p-1.5 rounded text-muted-foreground hover:bg-muted/30 disabled:opacity-30" disabled={historyIdx <= 0}><Undo2 size={13} /></button>
        <button onClick={redo} title="Redo" className="p-1.5 rounded text-muted-foreground hover:bg-muted/30 disabled:opacity-30" disabled={historyIdx >= history.length - 1}><Redo2 size={13} /></button>
        <div className="w-px h-5 bg-border/30 mx-1" />
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground">Size:</span>
          <input type="range" min={1} max={20} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-16 h-1 accent-primary" />
          <span className="text-[9px] text-muted-foreground w-4">{brushSize}</span>
        </div>
        <div className="w-px h-5 bg-border/30 mx-1" />
        <button onClick={clearCanvas} title="Clear" className="p-1.5 rounded text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><Trash2 size={13} /></button>
        <button onClick={downloadCanvas} title="Save" className="p-1.5 rounded text-muted-foreground hover:bg-muted/30"><Download size={13} /></button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Color palette */}
        <div className="w-10 border-r border-border/20 p-1 flex flex-col gap-1 items-center overflow-y-auto scrollbar-os">
          <div className="w-7 h-7 rounded border-2 border-border/40 mb-1" style={{ backgroundColor: color }} />
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-sm border transition-transform ${color === c ? 'border-primary scale-110' : 'border-border/20 hover:scale-105'}`}
              style={{ backgroundColor: c }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer mt-1" title="Custom color" />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 ${tool === 'pencil' ? 'cursor-crosshair' : tool === 'eraser' ? 'cursor-cell' : tool === 'picker' ? 'cursor-copy' : 'cursor-crosshair'}`}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
      </div>

      <div className="px-3 py-1 text-[9px] text-muted-foreground border-t border-border/10 flex justify-between">
        <span>🎨 {tool.charAt(0).toUpperCase() + tool.slice(1)} • {brushSize}px</span>
        <span>{canvasRef.current?.width || 0}×{canvasRef.current?.height || 0}</span>
      </div>
    </div>
  );
}

function floodFill(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) {
  const canvas = ctx.canvas;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w = canvas.width;

  // Parse fill color
  const tmp = document.createElement('canvas').getContext('2d')!;
  tmp.fillStyle = fillColor;
  tmp.fillRect(0, 0, 1, 1);
  const fc = tmp.getImageData(0, 0, 1, 1).data;

  const idx = (y * w + x) * 4;
  const tr = data[idx], tg = data[idx + 1], tb = data[idx + 2];
  if (tr === fc[0] && tg === fc[1] && tb === fc[2]) return;

  const stack = [[x, y]];
  const match = (i: number) => data[i] === tr && data[i + 1] === tg && data[i + 2] === tb;

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const ci = (cy * w + cx) * 4;
    if (cx < 0 || cx >= w || cy < 0 || cy >= canvas.height || !match(ci)) continue;
    data[ci] = fc[0]; data[ci + 1] = fc[1]; data[ci + 2] = fc[2]; data[ci + 3] = 255;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  ctx.putImageData(imgData, 0, 0);
}
