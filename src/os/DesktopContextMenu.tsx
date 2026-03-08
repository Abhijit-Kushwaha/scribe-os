import React, { useState, useCallback } from 'react';
import { useOS } from './OSContext';

interface MenuPos { x: number; y: number; }

export function useDesktopContextMenu() {
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
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
  const { openWindow, createFolder, writeFile, settings, updateSetting } = useOS();

  const items = [
    { label: '📁 New Folder', action: () => { const n = prompt('Folder name:'); if (n) createFolder('C:/Users/Scribe/Desktop', n); } },
    { label: '📝 New Text File', action: () => { const n = prompt('File name:', 'untitled.txt'); if (n) writeFile(`C:/Users/Scribe/Desktop/${n}`, ''); } },
    { divider: true },
    { label: '💻 Open Terminal', action: () => openWindow('terminal', 'Terminal', 700, 450) },
    { label: '🖥️ Open CMD', action: () => openWindow('cmd', 'Command Prompt', 700, 450) },
    { label: '📁 Open Files', action: () => openWindow('files', 'Files', 600, 450) },
    { divider: true },
    { label: '⌨️ Code Editor', action: () => openWindow('code', 'Code Editor', 750, 500) },
    { label: '🤖 AI Chat', action: () => openWindow('aichat', 'AI Chat', 500, 500) },
    { divider: true },
    { label: `📌 Taskbar: ${settings.taskbarPosition === 'bottom' ? 'Move to Top' : 'Move to Bottom'}`, action: () => updateSetting('taskbarPosition', settings.taskbarPosition === 'bottom' ? 'top' : 'bottom') },
    { label: '⚙️ Settings', action: () => openWindow('settings', 'Settings', 450, 400) },
  ];

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 220),
    top: Math.min(y, window.innerHeight - 400),
    zIndex: 99990,
  };

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 99989 }} onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div style={menuStyle} className="w-56 os-glass rounded-lg py-1 os-window-shadow animate-scale-in">
        {items.map((item, i) =>
          'divider' in item ? (
            <div key={i} className="h-px bg-border/20 my-1 mx-2" />
          ) : (
            <button
              key={i}
              onClick={() => { item.action?.(); onClose(); }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-foreground/80 hover:bg-primary/15 hover:text-foreground transition-colors flex items-center gap-2"
            >
              {item.label}
            </button>
          )
        )}
      </div>
    </>
  );
}
