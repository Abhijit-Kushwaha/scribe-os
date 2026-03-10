import React, { useState, useCallback } from 'react';
import { Download, Upload, Plus } from 'lucide-react';

const COLS = 10;
const ROWS = 20;
const colLabel = (i: number) => String.fromCharCode(65 + i);

export default function SpreadsheetApp({ windowId }: { windowId: string }) {
  const [cells, setCells] = useState<Record<string, string>>({
    'A1': 'Item', 'B1': 'Qty', 'C1': 'Price', 'D1': 'Total',
    'A2': 'Widgets', 'B2': '10', 'C2': '5.99', 'D2': '=B2*C2',
    'A3': 'Gadgets', 'B3': '5', 'C3': '12.50', 'D3': '=B3*C3',
    'A4': 'Parts', 'B4': '100', 'C4': '0.75', 'D4': '=B4*C4',
    'A6': 'Grand Total', 'D6': '=D2+D3+D4',
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState('A1');
  const [editValue, setEditValue] = useState('');

  const resolve = useCallback((key: string, visited = new Set<string>()): number => {
    if (visited.has(key)) return NaN;
    visited.add(key);
    const raw = cells[key];
    if (!raw) return 0;
    if (!raw.startsWith('=')) return parseFloat(raw) || 0;
    let expr = raw.slice(1);
    // Replace cell refs
    expr = expr.replace(/([A-J])(\d+)/gi, (_, c, r) => {
      return `${resolve(c.toUpperCase() + r, new Set(visited))}`;
    });
    // SUM(A1:A5)
    expr = expr.replace(/SUM\(([A-J])(\d+):([A-J])(\d+)\)/gi, (_, c1, r1, c2, r2) => {
      let sum = 0;
      const ci1 = c1.toUpperCase().charCodeAt(0) - 65, ci2 = c2.toUpperCase().charCodeAt(0) - 65;
      for (let c = ci1; c <= ci2; c++)
        for (let r = parseInt(r1); r <= parseInt(r2); r++)
          sum += resolve(`${colLabel(c)}${r}`, new Set(visited));
      return `${sum}`;
    });
    try { return new Function(`return ${expr}`)(); } catch { return NaN; }
  }, [cells]);

  const display = (key: string) => {
    const raw = cells[key];
    if (!raw) return '';
    if (!raw.startsWith('=')) return raw;
    const v = resolve(key);
    return isNaN(v) ? '#ERR' : (Number.isInteger(v) ? v.toString() : v.toFixed(2));
  };

  const startEdit = (key: string) => { setEditing(key); setEditValue(cells[key] || ''); };
  const finishEdit = () => {
    if (editing) { setCells(p => ({ ...p, [editing]: editValue })); setEditing(null); }
  };

  const exportCSV = () => {
    let csv = '';
    for (let r = 1; r <= ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push(display(`${colLabel(c)}${r}`));
      csv += row.join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'spreadsheet.csv'; a.click();
  };

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))] font-mono-os">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border/20 bg-secondary/10 shrink-0">
        <span className="text-[10px] text-muted-foreground px-1 bg-muted/30 rounded w-8 text-center">{selected}</span>
        <div className="w-px h-4 bg-border/20" />
        <div className="flex-1 flex items-center bg-muted/20 rounded px-2 py-0.5">
          <span className="text-[10px] text-muted-foreground mr-1">fx</span>
          <span className="text-[10px] text-foreground">{cells[selected] || ''}</span>
        </div>
        <button onClick={exportCSV} className="p-1 rounded hover:bg-muted/40 text-muted-foreground" title="Export CSV"><Download size={12} /></button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto scrollbar-os">
        <table className="border-collapse text-[10px] w-max">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-secondary/30 w-8 border border-border/20 text-muted-foreground" />
              {Array.from({ length: COLS }).map((_, c) => (
                <th key={c} className="sticky top-0 z-10 bg-secondary/30 border border-border/20 px-2 py-1 text-muted-foreground font-medium min-w-[72px]">
                  {colLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }).map((_, r) => (
              <tr key={r}>
                <td className="sticky left-0 z-10 bg-secondary/30 border border-border/20 px-1.5 py-0.5 text-center text-muted-foreground font-medium">{r + 1}</td>
                {Array.from({ length: COLS }).map((_, c) => {
                  const key = `${colLabel(c)}${r + 1}`;
                  const isEditing = editing === key;
                  const isSel = selected === key;
                  return (
                    <td key={c}
                      className={`border border-border/20 px-1.5 py-0.5 cursor-cell ${isSel ? 'ring-2 ring-primary ring-inset' : ''} ${cells[key]?.startsWith('=') && !isEditing ? 'text-primary' : 'text-foreground'}`}
                      onClick={() => setSelected(key)}
                      onDoubleClick={() => startEdit(key)}>
                      {isEditing ? (
                        <input value={editValue} onChange={e => setEditValue(e.target.value)}
                          onBlur={finishEdit} onKeyDown={e => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') setEditing(null); }}
                          className="w-full bg-transparent outline-none text-foreground text-[10px]" autoFocus />
                      ) : display(key)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between px-3 py-0.5 border-t border-border/10 text-[9px] text-muted-foreground bg-secondary/5">
        <span>Sheet 1</span>
        <span>{Object.keys(cells).length} cells</span>
      </div>
    </div>
  );
}
