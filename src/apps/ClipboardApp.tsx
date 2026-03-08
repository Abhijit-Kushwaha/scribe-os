import React, { useState, useEffect, useCallback } from 'react';
import { Clipboard, Pin, Search, Trash2, Copy, Star, Clock, Hash } from 'lucide-react';

interface ClipItem {
  id: string;
  text: string;
  time: number;
  pinned: boolean;
  starred: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const DEMO_ITEMS: ClipItem[] = [
  { id: uid(), text: 'npm install react@latest', time: Date.now() - 60000, pinned: true, starred: false },
  { id: uid(), text: 'SELECT * FROM users WHERE role = \'admin\';', time: Date.now() - 120000, pinned: false, starred: true },
  { id: uid(), text: 'git commit -m "feat: add clipboard manager"', time: Date.now() - 300000, pinned: false, starred: false },
  { id: uid(), text: 'https://github.com/scribe-os/core', time: Date.now() - 600000, pinned: false, starred: false },
  { id: uid(), text: '192.168.1.42', time: Date.now() - 900000, pinned: true, starred: false },
  { id: uid(), text: 'const result = await fetch(url);', time: Date.now() - 1200000, pinned: false, starred: false },
  { id: uid(), text: 'ssh root@10.0.0.1 -p 2222', time: Date.now() - 1500000, pinned: false, starred: true },
  { id: uid(), text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', time: Date.now() - 2000000, pinned: false, starred: false },
];

export default function ClipboardApp({ windowId }: { windowId: string }) {
  const [items, setItems] = useState<ClipItem[]>(() => {
    try { const s = localStorage.getItem('scribe-clipboard'); return s ? JSON.parse(s) : DEMO_ITEMS; } catch { return DEMO_ITEMS; }
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'starred'>('all');

  useEffect(() => { localStorage.setItem('scribe-clipboard', JSON.stringify(items)); }, [items]);

  // Listen for copy events
  useEffect(() => {
    const handler = () => {
      setTimeout(() => {
        navigator.clipboard.readText?.().then(text => {
          if (text && !items.find(i => i.text === text)) {
            setItems(prev => [{ id: uid(), text, time: Date.now(), pinned: false, starred: false }, ...prev].slice(0, 100));
          }
        }).catch(() => {});
      }, 100);
    };
    document.addEventListener('copy', handler);
    return () => document.removeEventListener('copy', handler);
  }, [items]);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  const toggle = (id: string, field: 'pinned' | 'starred') => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: !i[field] } : i));
  };

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearAll = () => setItems(prev => prev.filter(i => i.pinned));

  const sorted = [...items].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.time - a.time);
  const filtered = sorted.filter(i => {
    if (filter === 'pinned' && !i.pinned) return false;
    if (filter === 'starred' && !i.starred) return false;
    if (search && !i.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const timeAgo = (t: number) => {
    const d = Date.now() - t;
    if (d < 60000) return 'Just now';
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return `${Math.floor(d / 86400000)}d ago`;
  };

  const getType = (text: string) => {
    if (text.startsWith('http://') || text.startsWith('https://')) return { label: 'URL', color: 'text-blue-400' };
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(text)) return { label: 'IP', color: 'text-orange-400' };
    if (text.includes('SELECT') || text.includes('INSERT') || text.includes('FROM')) return { label: 'SQL', color: 'text-purple-400' };
    if (text.startsWith('git ') || text.startsWith('npm ') || text.startsWith('ssh ')) return { label: 'CMD', color: 'text-os-terminal-green' };
    if (text.includes('=>') || text.includes('const ') || text.includes('function')) return { label: 'CODE', color: 'text-os-terminal-cyan' };
    return { label: 'TEXT', color: 'text-muted-foreground' };
  };

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/20 bg-secondary/10">
        <div className="flex items-center gap-2 mb-2">
          <Clipboard size={14} className="text-primary" />
          <div className="flex-1 flex items-center gap-1 bg-muted/30 rounded px-2 py-1">
            <Search size={10} className="text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clipboard..." className="flex-1 bg-transparent text-[10px] outline-none text-foreground" />
          </div>
          <button onClick={clearAll} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive" title="Clear unpinned"><Trash2 size={13} /></button>
        </div>
        <div className="flex gap-1">
          {(['all', 'pinned', 'starred'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[10px] capitalize ${filter === f ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'}`}>
              {f === 'all' ? `All (${items.length})` : f === 'pinned' ? `📌 Pinned (${items.filter(i => i.pinned).length})` : `⭐ Starred (${items.filter(i => i.starred).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-os">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <Clipboard size={24} className="mx-auto mb-2 opacity-30" />
            {search ? 'No matches found' : 'Clipboard is empty'}
          </div>
        )}
        {filtered.map(item => {
          const type = getType(item.text);
          return (
            <div key={item.id} className="group px-3 py-2 border-b border-border/5 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-foreground font-mono-os break-all line-clamp-2">{item.text}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] px-1 py-0 rounded bg-muted/30 ${type.color}`}>{type.label}</span>
                    <span className="text-[8px] text-muted-foreground/50 flex items-center gap-0.5"><Clock size={7} />{timeAgo(item.time)}</span>
                    <span className="text-[8px] text-muted-foreground/50">{item.text.length} chars</span>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => copy(item.text)} className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary" title="Copy"><Copy size={11} /></button>
                  <button onClick={() => toggle(item.id, 'pinned')} className={`p-1 rounded hover:bg-muted/30 ${item.pinned ? 'text-primary' : 'text-muted-foreground'}`}><Pin size={11} /></button>
                  <button onClick={() => toggle(item.id, 'starred')} className={`p-1 rounded hover:bg-muted/30 ${item.starred ? 'text-yellow-400' : 'text-muted-foreground'}`}><Star size={11} /></button>
                  <button onClick={() => remove(item.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-1 text-[9px] text-muted-foreground border-t border-border/10 flex justify-between">
        <span>📋 {items.length} items • {items.filter(i => i.pinned).length} pinned</span>
        <span>Copy text anywhere to capture</span>
      </div>
    </div>
  );
}
