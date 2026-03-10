import React, { useState, useEffect, useCallback } from 'react';
import { useOS } from './OSContext';
import { APP_REGISTRY } from './appRegistry';

export default function WindowSwitcher() {
  const { windows, focusWindow } = useOS();
  const [visible, setVisible] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const nonMinimized = windows.filter(w => !w.minimized || true); // Show all

  useEffect(() => {
    let altDown = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') altDown = true;
      if (e.key === 'Tab' && altDown && nonMinimized.length > 1) {
        e.preventDefault();
        if (!visible) {
          setVisible(true);
          setSelectedIdx(1 % nonMinimized.length);
        } else {
          setSelectedIdx(prev => (prev + (e.shiftKey ? -1 : 1) + nonMinimized.length) % nonMinimized.length);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altDown = false;
        if (visible) {
          setVisible(false);
          const win = nonMinimized[selectedIdx];
          if (win) focusWindow(win.id);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [visible, selectedIdx, nonMinimized, focusWindow]);

  if (!visible || nonMinimized.length < 2) return null;

  return (
    <div className="fixed inset-0 z-[99995] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="os-glass rounded-xl p-4 flex gap-3 max-w-[600px] overflow-x-auto">
        {nonMinimized.map((win, i) => {
          const app = APP_REGISTRY.find(a => a.id === win.appId);
          return (
            <div
              key={win.id}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg min-w-[100px] transition-all cursor-pointer ${
                i === selectedIdx ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted/20'
              }`}
              onClick={() => { focusWindow(win.id); setVisible(false); }}
            >
              <span className="text-3xl">{app?.icon || '📄'}</span>
              <span className={`text-[11px] text-center truncate w-full ${i === selectedIdx ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {win.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
