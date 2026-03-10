import { supabase } from '@/integrations/supabase/client';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export const notesService = {
  async getNotes(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content, color, pinned, created_at, updated_at')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return (data || []).map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      color: note.color,
      pinned: note.pinned,
      createdAt: new Date(note.created_at).getTime(),
      updatedAt: new Date(note.updated_at).getTime(),
    }));
  },

  async createNote(title: string = 'Untitled', color: string = 'blue'): Promise<Note | null> {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ title, color, content: '' }])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    return data ? {
      id: data.id,
      title: data.title,
      content: data.content,
      color: data.color,
      pinned: data.pinned,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    } : null;
  },

  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.content !== undefined && { content: updates.content }),
        ...(updates.color !== undefined && { color: updates.color }),
        ...(updates.pinned !== undefined && { pinned: updates.pinned }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) console.error('Error updating note:', error);
  },

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting note:', error);
  },

  async togglePin(id: string, pinned: boolean): Promise<void> {
    await this.updateNote(id, { pinned });
  },
};
