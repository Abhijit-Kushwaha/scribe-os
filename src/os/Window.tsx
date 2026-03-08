import React, { useRef, useCallback, useState } from 'react';
import { useOS } from './OSContext';
import { OSWindow } from './types';
import { X, Minus, Square, Maximize2 } from 'lucide-react';

interface Props {
  window: OSWindow;
  children: React.ReactNode;
}

export default function Window({ window: win, children }: Props) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow } = useOS();
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, winX: 0, winY: 0 });
  const resizeRef = useRef({ resizing: false, startX: 0, startY: 0, startW: 0, startH: 0 });
  const [closing, setClosing] = useState(false);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (win.maximized) return;
    e.preventDefault();
    focusWindow(win.id);
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, winX: win.x, winY: win.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      moveWindow(win.id, dragRef.current.winX + dx, Math.max(0, dragRef.current.winY + dy));
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [win.id, win.x, win.y, win.maximized, focusWindow, moveWindow]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    if (win.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);
    resizeRef.current = { resizing: true, startX: e.clientX, startY: e.clientY, startW: win.width, startH: win.height };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current.resizing) return;
      const dw = ev.clientX - resizeRef.current.startX;
      const dh = ev.clientY - resizeRef.current.startY;
      resizeWindow(win.id, resizeRef.current.startW + dw, resizeRef.current.startH + dh);
    };
    const onUp = () => {
      resizeRef.current.resizing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [win.id, win.width, win.height, win.maximized, focusWindow, resizeWindow]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => closeWindow(win.id), 150);
  };

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 48px)', zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      className={`absolute flex flex-col rounded-lg overflow-hidden os-window-shadow ${closing ? 'opacity-0 scale-95' : 'animate-window-open'} transition-[opacity,transform] duration-150`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        className={`flex items-center h-9 px-3 gap-2 select-none cursor-grab active:cursor-grabbing shrink-0 ${win.focused ? 'bg-os-window-header' : 'bg-secondary'}`}
        onMouseDown={onDragStart}
        onDoubleClick={() => maximizeWindow(win.id)}
      >
        <span className="text-xs font-medium text-muted-foreground truncate flex-1">{win.title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => minimizeWindow(win.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <Minus size={12} />
          </button>
          <button onClick={() => maximizeWindow(win.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            {win.maximized ? <Square size={10} /> : <Maximize2 size={12} />}
          </button>
          <button onClick={handleClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive text-muted-foreground hover:text-destructive-foreground transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 bg-os-window-body overflow-hidden">
        {children}
      </div>
      {/* Resize handle */}
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={onResizeStart}
        />
      )}
    </div>
  );
}
