import React, { useState, useEffect } from 'react';
import { useOS } from './OSContext';
import { APP_REGISTRY } from './appRegistry';
import StartMenu from './StartMenu';

export default function Taskbar() {
  const { windows, focusWindow, minimizeWindow, settings } = useOS();
  const [time, setTime] = useState(new Date());
  const [startOpen, setStartOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleTaskbarClick = (id: string, minimized: boolean) => {
    if (minimized) focusWindow(id);
    else minimizeWindow(id);
  };

  const isTop = settings.taskbarPosition === 'top';

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(settings.showSeconds ? { second: '2-digit' } : {}),
    hour12: !settings.use24Hour,
  };

  return (
    <>
      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
      <div
        className={`absolute left-0 right-0 h-12 ${settings.transparency ? 'taskbar-blur' : 'bg-[hsl(var(--os-taskbar))]'} border-border/30 flex items-center px-2 gap-1 ${
          isTop ? 'top-0 border-b' : 'bottom-0 border-t'
        }`}
        style={{ zIndex: 9999 }}
      >
        {/* Start button */}
        <button
          onClick={() => setStartOpen(!startOpen)}
          className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all ${startOpen ? 'bg-primary/20 text-primary' : 'hover:bg-muted/50 text-os-taskbar-fg'}`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <rect x="2" y="2" width="9" height="9" rx="1" />
            <rect x="13" y="2" width="9" height="9" rx="1" />
            <rect x="2" y="13" width="9" height="9" rx="1" />
            <rect x="13" y="13" width="9" height="9" rx="1" />
          </svg>
        </button>

        <div className="w-px h-6 bg-border/30 mx-1" />

        {/* Open windows */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {windows.map(win => {
            const app = APP_REGISTRY.find(a => a.id === win.appId);
            return (
              <button
                key={win.id}
                onClick={() => handleTaskbarClick(win.id, win.minimized)}
                className={`h-9 px-3 flex items-center gap-2 rounded-lg text-xs transition-all min-w-0 ${
                  win.focused && !win.minimized
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'hover:bg-muted/30 text-os-taskbar-fg'
                }`}
              >
                <span className="text-sm">{app?.icon || '📄'}</span>
                <span className="truncate max-w-[100px]">{win.title}</span>
                {win.focused && !win.minimized && <div className="w-1 h-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        {/* System tray */}
        <div className="flex items-center gap-3 px-3 text-xs text-os-taskbar-fg">
          <span className="opacity-60">🔊</span>
          <span className="opacity-60">📶</span>
          <div className="text-right">
            <div className="font-medium">{time.toLocaleTimeString([], timeOptions)}</div>
            <div className="text-[10px] opacity-60">{time.toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </>
  );
}
