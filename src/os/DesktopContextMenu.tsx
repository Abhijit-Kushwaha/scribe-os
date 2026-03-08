import React, { useState, useCallback } from 'react';
import { useOS } from './OSContext';

interface MenuPos { x: number; y: number; }

export function useDesktopContextMenu() {
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Only trigger on the desktop bg, not on icons/windows
    if ((e.target as HTMLElement).closest('[data-no-ctx]')) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setMenuPos(null), []);

  return { menuPos, handleContextMenu, closeMenu };
}

interface Props {
  x: number;
  y: number;
  onClose: () => void;
}

export default function DesktopContextMenu({ x, y, onClose }: Props) {
  const { openWindow, createFolder } = useOS();

  const items = [
    { label: '📁 New Folder', action: () => { createFolder('C:/Users/Scribe/Desktop', `Folder_${Date.now()}`); } },
    { label: '📝 New Text File', action: () => {} },
    { divider: true },
    { label: '💻 Open Terminal', action: () => openWindow('terminal', 'Terminal', 700, 450) },
    { label: '🖥️ Open CMD', action: () => openWindow('cmd', 'Command Prompt', 700, 450) },
    { divider: true },
    { label: '🔄 Refresh', action: () => {} },
    { label: '⚙️ Settings', action: () => openWindow('settings', 'Settings', 450, 400) },
  ];

  // Adjust position so menu stays in viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 300),
    zIndex: 99990,
  };

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 99989 }} onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div style={menuStyle} className="w-52 bg-os-window-header/95 backdrop-blur-xl border border-border/40 rounded-lg py-1 shadow-2xl animate-scale-in">
        {items.map((item, i) =>
          'divider' in item ? (
            <div key={i} className="h-px bg-border/30 my-1 mx-2" />
          ) : (
            <button
              key={i}
              onClick={() => { item.action?.(); onClose(); }}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground/80 hover:bg-primary/15 hover:text-foreground transition-colors flex items-center gap-2"
            >
              {item.label}
            </button>
          )
        )}
      </div>
    </>
  );
}
