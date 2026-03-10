import React, { useState } from 'react';
import { useOS } from '../os/OSContext';
import { FileNode } from '../os/types';
import {
  Folder, FileText, ArrowLeft, ArrowRight, Plus, Trash2, Home, HardDrive,
  Download, Image, Music, FolderOpen, Grid, List, Search, ChevronRight
} from 'lucide-react';

const QUICK_ACCESS = [
  { name: 'Home', path: 'C:/Users/Scribe', icon: Home },
  { name: 'Desktop', path: 'C:/Users/Scribe/Desktop', icon: FolderOpen },
  { name: 'Documents', path: 'C:/Users/Scribe/Documents', icon: FileText },
  { name: 'Downloads', path: 'C:/Users/Scribe/Downloads', icon: Download },
  { name: 'Pictures', path: 'C:/Users/Scribe/Pictures', icon: Image },
  { name: 'System', path: 'C:/System', icon: HardDrive },
];

export default function FileManagerApp() {
  const { getNode, createFolder, deleteNode, writeFile } = useOS();
  const [path, setPath] = useState('C:');
  const [history, setHistory] = useState<string[]>(['C:']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const node = getNode(path);
  const items = node?.children || [];
  const breadcrumbs = path.split('/').filter(Boolean);

  const filteredItems = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const navigateTo = (newPath: string) => {
    setPath(newPath);
    setSelected(null);
    setSearch('');
    const newHistory = [...history.slice(0, historyIdx + 1), newPath];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const goUp = () => {
    const parts = path.split('/');
    if (parts.length > 1) navigateTo(parts.slice(0, -1).join('/'));
  };

  const goBack = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setPath(history[historyIdx - 1]);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setPath(history[historyIdx + 1]);
    }
  };

  const handleNewFolder = () => {
    const name = prompt('Folder name:');
    if (name) createFolder(path, name);
  };

  const handleNewFile = () => {
    const name = prompt('File name:');
    if (name) writeFile(`${path}/${name}`, '');
  };

  const getIcon = (item: FileNode) => {
    if (item.type === 'folder') return <Folder size={viewMode === 'grid' ? 28 : 16} className="text-primary" />;
    const ext = item.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'png', 'gif', 'svg'].includes(ext || '')) return <Image size={viewMode === 'grid' ? 28 : 16} className="text-pink-400" />;
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music size={viewMode === 'grid' ? 28 : 16} className="text-purple-400" />;
    return <FileText size={viewMode === 'grid' ? 28 : 16} className="text-muted-foreground" />;
  };

  return (
    <div className="h-full flex text-sm bg-[hsl(var(--os-window-body))]">
      {/* Sidebar */}
      <div className="w-40 shrink-0 border-r border-border/20 bg-secondary/5 overflow-y-auto scrollbar-os py-2">
        <div className="px-2 mb-1 text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Quick Access</div>
        {QUICK_ACCESS.map(qa => (
          <button
            key={qa.path}
            onClick={() => navigateTo(qa.path)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors ${
              path === qa.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
            }`}
          >
            <qa.icon size={13} />
            <span>{qa.name}</span>
          </button>
        ))}
        <div className="border-t border-border/10 mt-2 pt-2 px-2 mb-1 text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Drives</div>
        <button
          onClick={() => navigateTo('C:')}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/20 hover:text-foreground"
        >
          <HardDrive size={13} />
          <span>C: Drive</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-secondary/10 border-b border-border/20 shrink-0">
          <button onClick={goBack} disabled={historyIdx <= 0} className="p-1 rounded hover:bg-muted/50 text-muted-foreground disabled:opacity-30">
            <ArrowLeft size={14} />
          </button>
          <button onClick={goForward} disabled={historyIdx >= history.length - 1} className="p-1 rounded hover:bg-muted/50 text-muted-foreground disabled:opacity-30">
            <ArrowRight size={14} />
          </button>
          <button onClick={goUp} className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
            <ArrowLeft size={14} className="rotate-90" />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-0.5 bg-muted/20 rounded px-2 py-1 min-w-0 overflow-x-auto">
            {breadcrumbs.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={10} className="text-muted-foreground/50 shrink-0" />}
                <button
                  onClick={() => navigateTo(breadcrumbs.slice(0, i + 1).join('/'))}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-1 bg-muted/20 rounded px-2 py-1 w-32">
            <Search size={10} className="text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-[10px] outline-none text-foreground w-full"
            />
          </div>

          <div className="w-px h-4 bg-border/20" />
          <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted/40'}`}>
            <List size={13} />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted/40'}`}>
            <Grid size={13} />
          </button>
          <div className="w-px h-4 bg-border/20" />
          <button onClick={handleNewFile} className="p-1 rounded hover:bg-muted/50 text-muted-foreground" title="New File">
            <FileText size={13} />
          </button>
          <button onClick={handleNewFolder} className="p-1 rounded hover:bg-muted/50 text-muted-foreground" title="New Folder">
            <Plus size={13} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-os p-2">
          {filteredItems.length === 0 && (
            <div className="text-center text-muted-foreground text-xs mt-8">
              {search ? 'No matching files' : 'Empty folder'}
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-5 gap-1">
              {filteredItems.map((item: FileNode) => (
                <button
                  key={item.name}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                    selected === item.name ? 'bg-primary/15 ring-1 ring-primary/30' : 'hover:bg-muted/20'
                  }`}
                  onClick={() => setSelected(item.name)}
                  onDoubleClick={() => item.type === 'folder' && navigateTo(`${path}/${item.name}`)}
                >
                  {getIcon(item)}
                  <span className="text-[10px] text-foreground text-center truncate w-full">{item.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-1 text-[9px] text-muted-foreground font-medium border-b border-border/10">
                <span className="flex-1">Name</span>
                <span className="w-16 text-right">Size</span>
                <span className="w-24 text-right">Modified</span>
                <span className="w-8" />
              </div>
              {filteredItems.map((item: FileNode) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
                    selected === item.name ? 'bg-primary/10' : 'hover:bg-muted/20'
                  }`}
                  onClick={() => setSelected(item.name)}
                  onDoubleClick={() => item.type === 'folder' && navigateTo(`${path}/${item.name}`)}
                >
                  {getIcon(item)}
                  <span className="flex-1 text-xs truncate text-foreground">{item.name}</span>
                  <span className="w-16 text-right text-[10px] text-muted-foreground">
                    {item.size !== undefined ? `${item.size}B` : item.type === 'folder' ? `${item.children?.length || 0} items` : ''}
                  </span>
                  <span className="w-24 text-right text-[10px] text-muted-foreground">
                    {item.modified ? new Date(item.modified).toLocaleDateString() : '—'}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteNode(`${path}/${item.name}`); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all w-8"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-3 py-1 bg-secondary/5 border-t border-border/10 text-[9px] text-muted-foreground flex justify-between">
          <span>{filteredItems.length} items{selected ? ` • ${selected} selected` : ''}</span>
          <span>{path}</span>
        </div>
      </div>
    </div>
  );
}
