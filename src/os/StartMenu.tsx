import React, { useState, useMemo } from 'react';
import { useOS } from './OSContext';
import { APP_REGISTRY } from './appRegistry';
import { Search, Power, User, LogOut, RotateCcw, Moon } from 'lucide-react';

interface Props { onClose: () => void }

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core', apps: ['terminal', 'cmd', 'files', 'notepad', 'code'] },
  { id: 'internet', label: 'Internet', apps: ['browser', 'tor', 'email'] },
  { id: 'security', label: 'Security', apps: ['vpn', 'adblock', 'passwords'] },
  { id: 'media', label: 'Media', apps: ['music', 'video', 'images', 'paint'] },
  { id: 'productivity', label: 'Productivity', apps: ['notes', 'spreadsheet', 'calculator', 'contacts', 'clock'] },
  { id: 'utilities', label: 'Utilities', apps: ['taskmanager', 'settings', 'weather', 'network', 'keyboard', 'clipboard', 'sysinfo', 'recycle'] },
  { id: 'fun', label: 'Fun', apps: ['games', 'aichat'] },
];

export default function StartMenu({ onClose }: Props) {
  const { openWindow, settings } = useOS();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showPower, setShowPower] = useState(false);

  const launch = (appId: string, name: string, w?: number, h?: number) => {
    openWindow(appId, name, w, h);
    onClose();
  };

  const filteredApps = useMemo(() => {
    let apps = APP_REGISTRY;
    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(a => a.name.toLowerCase().includes(q) || a.id.includes(q));
    } else if (category !== 'all') {
      const cat = CATEGORIES.find(c => c.id === category);
      if (cat?.apps) apps = apps.filter(a => cat.apps!.includes(a.id));
    }
    return apps;
  }, [search, category]);

  const isTop = settings.taskbarPosition === 'top';

  return (
    <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose}>
      <div
        className={`absolute left-2 w-80 os-glass rounded-xl overflow-hidden animate-slide-up os-window-shadow ${isTop ? 'top-14' : 'bottom-14'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">{settings.username}</div>
              <div className="text-[9px] text-muted-foreground">Scribe OS v2.0</div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 border border-border/20 focus-within:border-primary/30 transition-colors">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search apps..."
              className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
        </div>

        {/* Categories */}
        {!search && (
          <div className="px-3 py-1 flex gap-1 overflow-x-auto scrollbar-os">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap transition-colors ${
                  category === cat.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Apps grid */}
        <div className="px-3 py-2 max-h-[280px] overflow-y-auto scrollbar-os">
          <div className="grid grid-cols-4 gap-1">
            {filteredApps.map(app => (
              <button
                key={app.id}
                onClick={() => launch(app.id, app.name, app.defaultWidth, app.defaultHeight)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/40 transition-colors group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{app.icon}</span>
                <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight truncate w-full">{app.name}</span>
              </button>
            ))}
          </div>
          {filteredApps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">No apps found</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border/20 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">⚡ {APP_REGISTRY.length} apps installed</span>
          <div className="relative">
            <button
              onClick={() => setShowPower(!showPower)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Power size={14} />
            </button>
            {showPower && (
              <div className="absolute bottom-full right-0 mb-1 w-36 os-glass rounded-lg py-1 os-window-shadow">
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground">
                  <Moon size={12} /> Sleep
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground">
                  <RotateCcw size={12} /> Restart
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-destructive hover:bg-destructive/10">
                  <LogOut size={12} /> Shut Down
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
