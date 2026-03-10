import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Pin, FileText, Palette } from 'lucide-react';
import { notesService } from '@/services/notesService';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_NOTES: Note[] = [
  { id: '1', title: 'Welcome to Notes', content: 'Click the + button to create a new note.\n\nYour notes are automatically saved to the cloud.', color: 'blue', pinned: true, createdAt: Date.now(), updatedAt: Date.now() },
];

const COLORS = ['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'teal'];
const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/20 border-blue-500/50',
  green: 'bg-green-500/20 border-green-500/50',
  yellow: 'bg-yellow-500/20 border-yellow-500/50',
  red: 'bg-red-500/20 border-red-500/50',
  purple: 'bg-fuchsia-500/20 border-fuchsia-500/50',
  pink: 'bg-pink-500/20 border-pink-500/50',
  teal: 'bg-teal-500/20 border-teal-500/50',
};

export default function NotesApp({ windowId }: { windowId: string }) {
  const [notes, setNotes] = useState<Note[]>(DEFAULT_NOTES);
  const [activeId, setActiveId] = useState(notes[0]?.id || '');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      const dbNotes = await notesService.getNotes();
      if (dbNotes.length > 0) {
        setNotes(dbNotes);
        if (!activeId) setActiveId(dbNotes[0].id);
      }
      setLoading(false);
    };
    loadNotes();
  }, []);

  const active = notes.find(n => n.id === activeId);
  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
  const filtered = search ? sorted.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())) : sorted;

  const addNote = async () => {
    const newNote = await notesService.createNote('Untitled');
    if (newNote) {
      setNotes(p => [newNote, ...p]);
      setActiveId(newNote.id);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    await notesService.updateNote(id, updates);
    setNotes(p => p.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = async (id: string) => {
    await notesService.deleteNote(id);
    setNotes(p => p.filter(n => n.id !== id));
    if (activeId === id) setActiveId(notes.find(n => n.id !== id)?.id || '');
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await notesService.togglePin(id, !pinned);
    setNotes(p => p.map(n => n.id === id ? { ...n, pinned: !pinned } : n));
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
                <div className={`w-2 h-2 rounded-full ${COLOR_MAP[n.color]?.split(' ')[0] || 'bg-blue-500'}`} />
                <span className="text-[11px] text-foreground truncate flex-1 font-medium">{n.title}</span>
              </div>
              <div className="text-[9px] text-muted-foreground truncate mt-0.5">{n.content.slice(0, 60)}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[8px] text-muted-foreground/50 ml-auto">{new Date(n.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="px-3 py-1.5 text-[9px] text-muted-foreground border-t border-border/10">{notes.length} notes</div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col" style={active ? { backgroundColor: `hsla(var(--color-${active.color}), 0.05)` } : {}}>
        {active ? (
          <>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/10">
              <input value={active.title} onChange={e => updateNote(active.id, { title: e.target.value })}
                className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none" />
              <div className="relative">
                <button onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1 rounded hover:bg-muted/30 text-muted-foreground">
                  <Palette size={12} />
                </button>
                {showColorPicker && (
                  <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-2 grid grid-cols-4 gap-2 z-50">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          updateNote(active.id, { color });
                          setShowColorPicker(false);
                        }}
                        className={`w-6 h-6 rounded border-2 transition-all ${COLOR_MAP[color]} ${active.color === color ? 'border-foreground' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => togglePin(active.id, active.pinned)}
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
