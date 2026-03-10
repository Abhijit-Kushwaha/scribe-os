import React, { useState } from 'react';
import { Trash2, RotateCw, AlertTriangle, FileText, Folder, Image } from 'lucide-react';

interface DeletedItem { id: string; name: string; type: 'file' | 'folder' | 'image'; originalPath: string; deletedAt: number; size: string; }

const ITEMS: DeletedItem[] = [
  { id: '1', name: 'old_notes.txt', type: 'file', originalPath: 'C:\\Users\\Scribe\\Documents', deletedAt: Date.now() - 86400000, size: '2.4 KB' },
  { id: '2', name: 'temp_project', type: 'folder', originalPath: 'C:\\Users\\Scribe\\Desktop', deletedAt: Date.now() - 172800000, size: '15.8 MB' },
  { id: '3', name: 'screenshot_old.png', type: 'image', originalPath: 'C:\\Users\\Scribe\\Pictures', deletedAt: Date.now() - 3600000, size: '842 KB' },
  { id: '4', name: 'backup.zip', type: 'file', originalPath: 'C:\\Users\\Scribe\\Downloads', deletedAt: Date.now() - 7200000, size: '128 MB' },
];

const icons = { file: FileText, folder: Folder, image: Image };

export default function RecycleBinApp({ windowId }: { windowId: string }) {
  const [items, setItems] = useState(ITEMS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const restore = (ids: string[]) => setItems(p => p.filter(i => !ids.includes(i.id)));
  const deletePerm = (ids: string[]) => setItems(p => p.filter(i => !ids.includes(i.id)));

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-secondary/10">
        <Trash2 size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium text-foreground flex-1">Recycle Bin</span>
        <button onClick={() => restore(Array.from(selected))} disabled={selected.size === 0}
          className="px-2 py-0.5 text-[10px] rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 flex items-center gap-1">
          <RotateCw size={10} /> Restore
        </button>
        <button onClick={() => { if (confirm('Empty recycle bin?')) setItems([]); }}
          className="px-2 py-0.5 text-[10px] rounded bg-destructive/20 text-destructive hover:bg-destructive/30 flex items-center gap-1">
          <AlertTriangle size={10} /> Empty
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-os">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Trash2 size={32} className="opacity-20 mb-2" />
            <div className="text-xs">Recycle Bin is empty</div>
          </div>
        ) : items.map(item => {
          const Icon = icons[item.type];
          return (
            <div key={item.id} onClick={() => toggleSelect(item.id)}
              className={`flex items-center gap-3 px-3 py-2 border-b border-border/5 cursor-pointer hover:bg-muted/20 ${selected.has(item.id) ? 'bg-primary/10' : ''}`}>
              <input type="checkbox" checked={selected.has(item.id)} readOnly className="accent-primary" />
              <Icon size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-foreground truncate">{item.name}</div>
                <div className="text-[9px] text-muted-foreground">{item.originalPath} • {item.size}</div>
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0">{new Date(item.deletedAt).toLocaleDateString()}</span>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-1 text-[9px] text-muted-foreground border-t border-border/10">{items.length} items</div>
    </div>
  );
}
