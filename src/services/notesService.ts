export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const NOTES_KEY = 'scribe-notes';

function load(): Note[] {
  try { const v = localStorage.getItem(NOTES_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
function save(notes: Note[]) { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }

export const notesService = {
  async getNotes(): Promise<Note[]> {
    return load().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
  },

  async createNote(title = 'Untitled', color = 'blue'): Promise<Note | null> {
    const notes = load();
    const note: Note = { id: crypto.randomUUID(), title, content: '', color, pinned: false, createdAt: Date.now(), updatedAt: Date.now() };
    notes.push(note);
    save(notes);
    return note;
  },

  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<void> {
    const notes = load();
    const idx = notes.findIndex(n => n.id === id);
    if (idx >= 0) {
      notes[idx] = { ...notes[idx], ...updates, updatedAt: Date.now() };
      save(notes);
    }
  },

  async deleteNote(id: string): Promise<void> {
    save(load().filter(n => n.id !== id));
  },

  async togglePin(id: string, pinned: boolean): Promise<void> {
    await this.updateNote(id, { pinned });
  },
};
