import React, { useState, useCallback } from 'react';
import { Key, Copy, Eye, EyeOff, Plus, Search, Trash2, Shield, RefreshCw, Lock } from 'lucide-react';

interface Entry { id: string; site: string; username: string; password: string; icon: string; }

const uid = () => Math.random().toString(36).slice(2, 9);
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
const genPw = (len: number) => Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

const DEFAULT_ENTRIES: Entry[] = [
  { id: '1', site: 'github.com', username: 'scribe@proton.me', password: genPw(20), icon: '🐙' },
  { id: '2', site: 'google.com', username: 'scribe.os@gmail.com', password: genPw(24), icon: '🔍' },
  { id: '3', site: 'protonmail.com', username: 'scribe', password: genPw(18), icon: '📧' },
  { id: '4', site: 'discord.com', username: 'ScribeOS#1337', password: genPw(16), icon: '💬' },
];

export default function PasswordManagerApp({ windowId }: { windowId: string }) {
  const [entries, setEntries] = useState(DEFAULT_ENTRIES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [genLen, setGenLen] = useState(20);
  const [genResult, setGenResult] = useState('');
  const [showGen, setShowGen] = useState(false);
  const [locked, setLocked] = useState(false);

  const filtered = search ? entries.filter(e => e.site.includes(search.toLowerCase()) || e.username.includes(search.toLowerCase())) : entries;
  const sel = entries.find(e => e.id === selected);

  const copy = (text: string) => { navigator.clipboard.writeText(text).catch(() => {}); };
  const addEntry = () => {
    const e: Entry = { id: uid(), site: 'new-site.com', username: 'user@email.com', password: genPw(genLen), icon: '🌐' };
    setEntries(p => [e, ...p]); setSelected(e.id);
  };
  const deleteEntry = (id: string) => { setEntries(p => p.filter(e => e.id !== id)); if (selected === id) setSelected(null); };
  const update = (id: string, upd: Partial<Entry>) => setEntries(p => p.map(e => e.id === id ? { ...e, ...upd } : e));

  if (locked) {
    return (
      <div className="h-full flex items-center justify-center bg-[hsl(var(--os-window-body))]">
        <div className="text-center">
          <Lock size={40} className="mx-auto mb-3 text-primary" />
          <div className="text-sm text-foreground mb-1">Vault Locked</div>
          <button onClick={() => setLocked(false)} className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90">Unlock</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-secondary/10">
        <Shield size={14} className="text-primary" />
        <div className="flex-1 flex items-center gap-1 bg-muted/30 rounded px-2 py-1">
          <Search size={10} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vault..." className="flex-1 bg-transparent text-[10px] outline-none text-foreground" />
        </div>
        <button onClick={addEntry} className="p-1 rounded hover:bg-muted/40 text-primary"><Plus size={14} /></button>
        <button onClick={() => setShowGen(!showGen)} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><Key size={14} /></button>
        <button onClick={() => setLocked(true)} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><Lock size={14} /></button>
      </div>

      {/* Generator */}
      {showGen && (
        <div className="px-3 py-2 border-b border-border/10 bg-primary/5">
          <div className="text-[10px] text-muted-foreground mb-1">Password Generator</div>
          <div className="flex items-center gap-2">
            <input value={genResult || genPw(genLen)} readOnly className="flex-1 bg-muted/30 rounded px-2 py-1 text-[10px] font-mono-os text-foreground" />
            <button onClick={() => setGenResult(genPw(genLen))} className="p-1 rounded hover:bg-muted/40 text-primary"><RefreshCw size={12} /></button>
            <button onClick={() => copy(genResult || '')} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><Copy size={12} /></button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-muted-foreground">Length: {genLen}</span>
            <input type="range" min={8} max={64} value={genLen} onChange={e => { setGenLen(+e.target.value); setGenResult(genPw(+e.target.value)); }}
              className="flex-1 h-1 accent-primary" />
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="flex-1 overflow-y-auto scrollbar-os">
        {filtered.map(e => (
          <div key={e.id} onClick={() => setSelected(e.id)}
            className={`flex items-center gap-3 px-3 py-2.5 border-b border-border/5 cursor-pointer hover:bg-muted/20 transition-colors ${selected === e.id ? 'bg-primary/10' : ''}`}>
            <span className="text-lg">{e.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-foreground font-medium truncate">{e.site}</div>
              <div className="text-[10px] text-muted-foreground truncate">{e.username}</div>
            </div>
            <div className="flex gap-0.5">
              <button onClick={ev => { ev.stopPropagation(); copy(e.password); }} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><Copy size={11} /></button>
              <button onClick={ev => { ev.stopPropagation(); setShowPw(p => ({ ...p, [e.id]: !p[e.id] })); }} className="p-1 rounded hover:bg-muted/40 text-muted-foreground">
                {showPw[e.id] ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
              <button onClick={ev => { ev.stopPropagation(); deleteEntry(e.id); }} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground"><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail */}
      {sel && (
        <div className="border-t border-border/20 px-3 py-2 bg-secondary/5">
          <div className="text-[10px] text-muted-foreground mb-1">Password</div>
          <div className="flex items-center gap-1 bg-muted/30 rounded px-2 py-1">
            <span className="flex-1 text-[10px] font-mono-os text-foreground truncate">{showPw[sel.id] ? sel.password : '•'.repeat(16)}</span>
          </div>
        </div>
      )}

      <div className="px-3 py-1 text-[9px] text-muted-foreground border-t border-border/10 flex justify-between">
        <span>🔒 AES-256 encrypted</span>
        <span>{entries.length} entries</span>
      </div>
    </div>
  );
}
