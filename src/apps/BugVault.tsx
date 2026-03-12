import React, { useState } from 'react';

interface BugNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  bounty: number;
  program: string;
  created: number;
}

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info'] as const;
const SEV_COLOR: Record<string, string> = { Critical: '#ff5252', High: '#ff6e40', Medium: '#ffab40', Low: '#40c4ff', Info: '#b0bec5' };

const INITIAL_NOTES: BugNote[] = [
  { id: '1', title: 'IDOR on /api/users/{id}', content: '## Steps\n1. Login as user A\n2. Change user_id in request\n3. Access user B data\n\n## Impact\nFull account takeover via IDOR\n\n```http\nGET /api/users/1337 HTTP/1.1\nAuthorization: Bearer <userA_token>\n```', tags: ['idor', 'api'], severity: 'Critical', bounty: 5000, program: 'HackerOne - Acme Corp', created: Date.now() - 86400000 },
  { id: '2', title: 'Reflected XSS in search', content: '## Payload\n```html\n<img src=x onerror=alert(1)>\n```\n\nFound in search parameter, no CSP bypass needed.', tags: ['xss', 'reflected'], severity: 'Medium', bounty: 500, program: 'Bugcrowd - Beta Inc', created: Date.now() - 172800000 },
];

export default function BugVault({ windowId }: { windowId: string }) {
  const [notes, setNotes] = useState<BugNote[]>(INITIAL_NOTES);
  const [selected, setSelected] = useState<string>(INITIAL_NOTES[0].id);
  const [editing, setEditing] = useState(false);

  const current = notes.find(n => n.id === selected);

  const addNote = () => {
    const n: BugNote = { id: crypto.randomUUID(), title: 'New Finding', content: '## Description\n\n## Steps to Reproduce\n\n## Impact\n', tags: [], severity: 'Medium', bounty: 0, program: '', created: Date.now() };
    setNotes([n, ...notes]);
    setSelected(n.id);
    setEditing(true);
  };

  const updateNote = (field: string, value: any) => {
    setNotes(prev => prev.map(n => n.id === selected ? { ...n, [field]: value } : n));
  };

  const totalBounty = notes.reduce((s, n) => s + n.bounty, 0);

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-terminal-bg))] text-[hsl(var(--foreground))] font-mono-os text-xs overflow-hidden">
      <div className="p-3 border-b border-[hsl(var(--border))] flex items-center gap-2">
        <span className="text-base">🔐</span>
        <span className="font-bold text-sm" style={{ color: 'hsl(var(--os-terminal-green))' }}>BugVault</span>
        <div className="flex-1" />
        <span className="text-[hsl(var(--os-terminal-green))] font-bold">${totalBounty.toLocaleString()}</span>
        <span className="text-[hsl(var(--muted-foreground))]">earned</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r border-[hsl(var(--border))] flex flex-col">
          <button onClick={addNote} className="m-2 px-2 py-1.5 rounded text-[10px] font-bold" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
            + New Finding
          </button>
          <div className="flex-1 overflow-auto scrollbar-os">
            {notes.map(n => (
              <div key={n.id} onClick={() => { setSelected(n.id); setEditing(false); }}
                className="p-2.5 border-b border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--muted))]"
                style={{ background: selected === n.id ? 'hsl(var(--muted))' : 'transparent' }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEV_COLOR[n.severity] }} />
                  <span className="font-bold text-[11px] truncate flex-1">{n.title}</span>
                </div>
                <div className="text-[9px] text-[hsl(var(--muted-foreground))] truncate">{n.program || 'No program'}</div>
                {n.bounty > 0 && <span className="text-[9px]" style={{ color: 'hsl(var(--os-terminal-green))' }}>${n.bounty}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        {current && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[hsl(var(--border))]">
              <input className="w-full bg-transparent text-sm font-bold text-[hsl(var(--foreground))] outline-none mb-2"
                value={current.title} onChange={e => updateNote('title', e.target.value)} />
              <div className="flex gap-2 items-center flex-wrap">
                <select className="bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded px-1.5 py-0.5 text-[10px] outline-none"
                  value={current.severity} onChange={e => updateNote('severity', e.target.value)} style={{ color: SEV_COLOR[current.severity] }}>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="w-20 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded px-1.5 py-0.5 text-[10px] outline-none text-[hsl(var(--os-terminal-green))]"
                  type="number" placeholder="$0" value={current.bounty || ''} onChange={e => updateNote('bounty', Number(e.target.value))} />
                <input className="flex-1 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded px-1.5 py-0.5 text-[10px] outline-none text-[hsl(var(--foreground))]"
                  placeholder="Program name" value={current.program} onChange={e => updateNote('program', e.target.value)} />
              </div>
            </div>
            <textarea
              className="flex-1 p-3 bg-transparent text-[hsl(var(--foreground))] outline-none resize-none scrollbar-os text-xs leading-5"
              value={current.content}
              onChange={e => updateNote('content', e.target.value)}
              placeholder="Write your finding notes in markdown..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
