import React, { useState } from 'react';
import { useOS } from '../os/OSContext';
import { FileNode } from '../os/types';
import { Folder, FileText, ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function FileManagerApp() {
  const { getNode, createFolder, deleteNode } = useOS();
  const [path, setPath] = useState('C:');

  const node = getNode(path);
  const items = node?.children || [];

  const navigate = (name: string) => setPath(`${path}/${name}`);
  const goUp = () => {
    const parts = path.split('/');
    if (parts.length > 1) setPath(parts.slice(0, -1).join('/'));
  };

  return (
    <div className="h-full flex flex-col text-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border/30">
        <button onClick={goUp} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1 px-2 py-1 bg-muted/30 rounded text-xs text-muted-foreground font-mono">{path}</div>
        <button
          onClick={() => { const n = prompt('Folder name:'); if (n) createFolder(path, n); }}
          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-os p-2">
        {items.length === 0 && <div className="text-center text-muted-foreground text-xs mt-8">Empty folder</div>}
        {items.map((item: FileNode) => (
          <div
            key={item.name}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 cursor-pointer group transition-colors"
            onDoubleClick={() => item.type === 'folder' && navigate(item.name)}
          >
            {item.type === 'folder'
              ? <Folder size={16} className="text-primary shrink-0" />
              : <FileText size={16} className="text-muted-foreground shrink-0" />
            }
            <span className="flex-1 text-xs truncate">{item.name}</span>
            {item.size !== undefined && <span className="text-[10px] text-muted-foreground">{item.size}B</span>}
            <button
              onClick={e => { e.stopPropagation(); deleteNode(`${path}/${item.name}`); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
