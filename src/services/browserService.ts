import { supabase } from '@/integrations/supabase/client';

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

export const browserService = {
  async addToHistory(entry: HistoryEntry): Promise<void> {
    const { error } = await supabase
      .from('browser_history')
      .insert([{
        url: entry.url,
        title: entry.title,
        visited_at: new Date().toISOString(),
      }]);

    if (error) console.error('Error adding to history:', error);
  },

  async getHistory(limit: number = 100): Promise<HistoryEntry[]> {
    const { data, error } = await supabase
      .from('browser_history')
      .select('id, url, title, visited_at')
      .order('visited_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      url: item.url,
      title: item.title,
      visitedAt: new Date(item.visited_at).getTime(),
    }));
  },

  async clearHistory(): Promise<void> {
    const { error } = await supabase
      .from('browser_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) console.error('Error clearing history:', error);
  },

  async addBookmark(bookmark: Bookmark): Promise<Bookmark | null> {
    const { data, error } = await supabase
      .from('browser_bookmarks')
      .insert([{
        name: bookmark.name,
        url: bookmark.url,
        icon: bookmark.icon || '🌐',
        category: bookmark.category || 'general',
      }])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error adding bookmark:', error);
      return null;
    }

    return data ? {
      id: data.id,
      name: data.name,
      url: data.url,
      icon: data.icon,
      category: data.category,
    } : null;
  },

  async getBookmarks(): Promise<Bookmark[]> {
    const { data, error } = await supabase
      .from('browser_bookmarks')
      .select('id, name, url, icon, category')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      url: item.url,
      icon: item.icon,
      category: item.category,
    }));
  },

  async deleteBookmark(id: string): Promise<void> {
    const { error } = await supabase
      .from('browser_bookmarks')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting bookmark:', error);
  },

  async saveSession(session: BrowserSession): Promise<void> {
    const { data: existing } = await supabase
      .from('browser_sessions')
      .select('id')
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('browser_sessions')
        .update({ session_data: session })
        .eq('id', existing.id);

      if (error) console.error('Error updating session:', error);
    } else {
      const { error } = await supabase
        .from('browser_sessions')
        .insert([{ session_data: session }]);

      if (error) console.error('Error saving session:', error);
    }
  },

  async getSession(): Promise<BrowserSession | null> {
    const { data, error } = await supabase
      .from('browser_sessions')
      .select('session_data')
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data ? data.session_data : null;
  },
};
