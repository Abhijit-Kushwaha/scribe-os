import React, { useState } from 'react';

interface Bug {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  program: string;
  bounty: number;
  column: string;
}

const COLUMNS = ['New', 'Triaged', 'POC Ready', 'Reported', 'Accepted', 'Paid'];
const COL_COLOR: Record<string, string> = { New: '#40c4ff', Triaged: '#e040fb', 'POC Ready': '#ffab40', Reported: 'hsl(var(--os-terminal-cyan))', Accepted: 'hsl(var(--os-terminal-green))', Paid: '#76ff03' };
const SEV_COLOR: Record<string, string> = { Critical: '#ff5252', High: '#ff6e40', Medium: '#ffab40', Low: '#40c4ff' };

const INITIAL_BUGS: Bug[] = [
  { id: '1', title: 'SSRF via webhook URL', severity: 'Critical', program: 'Acme Corp', bounty: 3000, column: 'Reported' },
  { id: '2', title: 'Stored XSS in comments', severity: 'High', program: 'Beta Inc', bounty: 1500, column: 'POC Ready' },
  { id: '3', title: 'IDOR on user profile', severity: 'High', program: 'Acme Corp', bounty: 2000, column: 'New' },
  { id: '4', title: 'Open redirect', severity: 'Medium', program: 'Gamma Ltd', bounty: 300, column: 'Triaged' },
  { id: '5', title: 'Rate limit bypass', severity: 'Medium', program: 'Beta Inc', bounty: 750, column: 'Accepted' },
  { id: '6', title: 'JWT none algorithm', severity: 'Critical', program: 'Delta Corp', bounty: 5000, column: 'Paid' },
];

export default function TriageBoard({ windowId }: { windowId: string }) {
  const [bugs, setBugs] = useState<Bug[]>(INITIAL_BUGS);
  const [dragging, setDragging] = useState<string | null>(null);

  const addBug = () => {
    const b: Bug = { id: crypto.randomUUID(), title: 'New Bug', severity: 'Medium', program: '', bounty: 0, column: 'New' };
    setBugs([...bugs, b]);
  };

  const moveBug = (bugId: string, col: string) => {
    setBugs(prev => prev.map(b => b.id === bugId ? { ...b, column: col } : b));
  };

  const totalPaid = bugs.filter(b => b.column === 'Paid').reduce((s, b) => s + b.bounty, 0);
  const totalPending = bugs.filter(b => b.column !== 'Paid').reduce((s, b) => s + b.bounty, 0);

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-terminal-bg))] text-[hsl(var(--foreground))] font-mono-os text-xs overflow-hidden">
      <div className="p-3 border-b border-[hsl(var(--border))] flex items-center gap-2">
        <span className="text-base">📋</span>
        <span className="font-bold text-sm" style={{ color: '#e040fb' }}>TriageBoard</span>
        <div className="flex-1" />
        <span className="text-[hsl(var(--os-terminal-green))] font-bold mr-2">${totalPaid.toLocaleString()} paid</span>
        <span className="text-[hsl(var(--muted-foreground))]">${totalPending.toLocaleString()} pending</span>
        <button onClick={addBug} className="ml-3 px-2 py-1 rounded text-[10px] font-bold" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>+ Bug</button>
      </div>

      <div className="flex-1 flex overflow-x-auto scrollbar-os p-2 gap-2">
        {COLUMNS.map(col => {
          const colBugs = bugs.filter(b => b.column === col);
          return (
            <div key={col} className="min-w-[160px] flex-1 flex flex-col"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragging) moveBug(dragging, col); setDragging(null); }}>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <span className="w-2 h-2 rounded-full" style={{ background: COL_COLOR[col] }} />
                <span className="font-bold text-[10px]" style={{ color: COL_COLOR[col] }}>{col}</span>
                <span className="text-[9px] text-[hsl(var(--muted-foreground))] ml-auto">{colBugs.length}</span>
              </div>
              <div className="flex-1 rounded-lg p-1 space-y-1.5 overflow-auto scrollbar-os" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
                {colBugs.map(bug => (
                  <div key={bug.id} draggable onDragStart={() => setDragging(bug.id)} onDragEnd={() => setDragging(null)}
                    className="p-2 rounded border cursor-grab active:cursor-grabbing transition-all hover:border-[hsl(var(--primary))]"
                    style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', opacity: dragging === bug.id ? 0.5 : 1 }}>
                    <div className="font-bold text-[10px] mb-1 text-[hsl(var(--foreground))]">{bug.title}</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[8px] px-1 py-0.5 rounded" style={{ color: SEV_COLOR[bug.severity], background: 'hsl(var(--muted))' }}>{bug.severity}</span>
                      {bug.program && <span className="text-[8px] text-[hsl(var(--muted-foreground))] truncate">{bug.program}</span>}
                      {bug.bounty > 0 && <span className="text-[8px] ml-auto" style={{ color: 'hsl(var(--os-terminal-green))' }}>${bug.bounty}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
