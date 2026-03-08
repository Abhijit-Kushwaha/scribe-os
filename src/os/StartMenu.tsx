import React from 'react';
import { useOS } from './OSContext';
import { APP_REGISTRY } from './appRegistry';

interface Props { onClose: () => void }

export default function StartMenu({ onClose }: Props) {
  const { openWindow } = useOS();

  const launch = (appId: string, name: string, w?: number, h?: number) => {
    openWindow(appId, name, w, h);
    onClose();
  };

  return (
    <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose}>
      <div
        className="absolute bottom-14 left-2 w-80 os-glass rounded-xl p-4 animate-slide-up os-window-shadow"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground os-glow-text">Scribe OS</h2>
          <p className="text-[10px] text-muted-foreground">v1.0 — Browser Runtime</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {APP_REGISTRY.map(app => (
            <button
              key={app.id}
              onClick={() => launch(app.id, app.name, app.defaultWidth, app.defaultHeight)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{app.icon}</span>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{app.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">⚡ All systems operational</span>
          <button className="text-[10px] text-primary hover:underline">Power</button>
        </div>
      </div>
    </div>
  );
}
