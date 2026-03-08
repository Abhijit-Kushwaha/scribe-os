import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Pin, Tag, FileText } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  tags: string[];
  modified: number;
}

const DEFAULT_NOTES: Note[] = [
  { id: '1', title: 'Pentest Checklist', content: '# Pentest Checklist\n\n- [ ] Nmap scan\n- [ ] Nikto web scan\n- [ ] SQLMap injection test\n- [x] Recon phase complete\n- [ ] Report generation', pinned: true, tags: ['security'], modified: Date.now() - 3600000 },
  { id: '2', title: 'Project Ideas', content: '## Ideas\n\n1. Browser-based OS\n2. AI-powered code editor\n3. Decentralized chat app', pinned: false, tags: ['dev'], modified: Date.now() - 7200000 },
  { id: '3', title: 'Quick Note', content: 'Remember to update dependencies this week.', pinned: false, tags: [], modified: Date.now() - 86400000 },
];

const uid = () => Math.random().toString(36).slice(2, 9);

export default function NotesApp({ windowId }: { windowId: string }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { const s = localStorage.getItem('scribe-notes'); return s ? JSON.parse(s) : DEFAULT_NOTES; } catch { return DEFAULT_NOTES; }
  });
  const [activeId, setActiveId] = useState(notes[0]?.id || '');
  const [search, setSearch] = useState('');

  useEffect(() => { localStorage.setItem('scribe-notes', JSON.stringify(notes)); }, [notes]);

  const active = notes.find(n => n.id === activeId);
  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.modified - a.modified);
  const filtered = search ? sorted.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())) : sorted;

  const addNote = () => {
    const n: Note = { id: uid(), title: 'Untitled', content: '', pinned: false, tags: [], modified: Date.now() };
    setNotes(p => [n, ...p]);
    setActiveId(n.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(p => p.map(n => n.id === id ? { ...n, ...updates, modified: Date.now() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(p => p.filter(n => n.id !== id));
    if (activeId === id) setActiveId(notes.find(n => n.id !== id)?.id || '');
  };

  return (
    <div className="h-full flex bg-[hsl(var(--os-window-body))]">
      {/* Sidebar */}
      <div className="w-48 border-r border-border/20 flex flex-col shrink-0">
        <div className="flex items-center gap-1 p-2 border-b border-border/10">
          <div className="flex-1 flex items-center gap-1 bg-muted/30 rounded px-2 py-1">
            <Search size={10} className="text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-[10px] outline-none text-foreground" />
          </div>
          <button onClick={addNote} className="p-1 rounded hover:bg-muted/40 text-primary"><Plus size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-os">
          {filtered.map(n => (
            <button key={n.id} onClick={() => setActiveId(n.id)}
              className={`w-full text-left px-3 py-2 border-b border-border/5 hover:bg-muted/20 transition-colors ${n.id === activeId ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}>
              <div className="flex items-center gap-1">
                {n.pinned && <Pin size={8} className="text-primary" />}
                <span className="text-[11px] text-foreground truncate flex-1 font-medium">{n.title}</span>
              </div>
              <div className="text-[9px] text-muted-foreground truncate mt-0.5">{n.content.slice(0, 60)}</div>
              <div className="flex items-center gap-1 mt-1">
                {n.tags.map(t => <span key={t} className="text-[8px] px-1 py-0 rounded bg-primary/10 text-primary">{t}</span>)}
                <span className="text-[8px] text-muted-foreground/50 ml-auto">{new Date(n.modified).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="px-3 py-1.5 text-[9px] text-muted-foreground border-t border-border/10">{notes.length} notes</div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/10">
              <input value={active.title} onChange={e => updateNote(active.id, { title: e.target.value })}
                className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none" />
              <button onClick={() => updateNote(active.id, { pinned: !active.pinned })}
                className={`p-1 rounded hover:bg-muted/30 ${active.pinned ? 'text-primary' : 'text-muted-foreground'}`}>
                <Pin size={12} />
              </button>
              <button onClick={() => deleteNote(active.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                <Trash2 size={12} />
              </button>
            </div>
            <textarea
              value={active.content}
              onChange={e => updateNote(active.id, { content: e.target.value })}
              className="flex-1 bg-transparent text-xs text-foreground p-3 outline-none resize-none font-mono-os scrollbar-os leading-relaxed"
              placeholder="Start writing..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <div className="text-xs">Select or create a note</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
