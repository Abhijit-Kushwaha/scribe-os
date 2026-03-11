export interface HistoryEntry {
  id?: string;
  url: string;
  title: string;
  visitedAt?: number;
}

export interface Bookmark {
  id?: string;
  name: string;
  url: string;
  icon?: string;
  category?: string;
}

export interface BrowserSession {
  id?: string;
  tabs: Array<{
    id: string;
    title: string;
    url: string;
    favicon: string;
  }>;
  activeTabId: string;
}

const HISTORY_KEY = 'scribe-browser-history';
const BOOKMARKS_KEY = 'scribe-browser-bookmarks';
const SESSION_KEY = 'scribe-browser-session';

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key: string, value: any) { localStorage.setItem(key, JSON.stringify(value)); }

export const browserService = {
  async addToHistory(entry: HistoryEntry): Promise<void> {
    const history = load<HistoryEntry[]>(HISTORY_KEY, []);
    history.unshift({ ...entry, id: crypto.randomUUID(), visitedAt: Date.now() });
    save(HISTORY_KEY, history.slice(0, 500));
  },

  async getHistory(limit = 100): Promise<HistoryEntry[]> {
    return load<HistoryEntry[]>(HISTORY_KEY, []).slice(0, limit);
  },

  async clearHistory(): Promise<void> {
    save(HISTORY_KEY, []);
  },

  async addBookmark(bookmark: Bookmark): Promise<Bookmark | null> {
    const bookmarks = load<Bookmark[]>(BOOKMARKS_KEY, []);
    const b = { ...bookmark, id: crypto.randomUUID(), icon: bookmark.icon || '🌐', category: bookmark.category || 'general' };
    bookmarks.push(b);
    save(BOOKMARKS_KEY, bookmarks);
    return b;
  },

  async getBookmarks(): Promise<Bookmark[]> {
    return load<Bookmark[]>(BOOKMARKS_KEY, []);
  },

  async deleteBookmark(id: string): Promise<void> {
    const bookmarks = load<Bookmark[]>(BOOKMARKS_KEY, []);
    save(BOOKMARKS_KEY, bookmarks.filter(b => b.id !== id));
  },

  async saveSession(session: BrowserSession): Promise<void> {
    save(SESSION_KEY, session);
  },

  async getSession(): Promise<BrowserSession | null> {
    return load<BrowserSession | null>(SESSION_KEY, null);
  },
};
