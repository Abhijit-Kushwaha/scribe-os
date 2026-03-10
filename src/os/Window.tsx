import React, { useRef, useCallback, useState } from 'react';
import { useOS } from './OSContext';
import { OSWindow } from './types';
import { X, Minus, Square, Maximize2 } from 'lucide-react';

interface Props {
  window: OSWindow;
  children: React.ReactNode;
}

export default function Window({ window: win, children }: Props) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow, snapWindow, settings } = useOS();
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, winX: 0, winY: 0 });
  const resizeRef = useRef({ resizing: false, startX: 0, startY: 0, startW: 0, startH: 0, edge: '' });
  const [closing, setClosing] = useState(false);
  const [snapPreview, setSnapPreview] = useState<'left' | 'right' | 'top' | null>(null);

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

      // Snap preview
      if (ev.clientX <= 2) setSnapPreview('left');
      else if (ev.clientX >= window.innerWidth - 2) setSnapPreview('right');
      else if (ev.clientY <= 2) setSnapPreview('top');
      else setSnapPreview(null);
    };
    const onUp = (ev: MouseEvent) => {
      dragRef.current.dragging = false;
      // Execute snap
      if (ev.clientX <= 2) snapWindow(win.id, 'left');
      else if (ev.clientX >= window.innerWidth - 2) snapWindow(win.id, 'right');
      else if (ev.clientY <= 2) snapWindow(win.id, 'maximize');
      setSnapPreview(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [win.id, win.x, win.y, win.maximized, focusWindow, moveWindow, snapWindow]);

  const onResizeStart = useCallback((e: React.MouseEvent, edge: string) => {
    if (win.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);
    resizeRef.current = { resizing: true, startX: e.clientX, startY: e.clientY, startW: win.width, startH: win.height, edge };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current.resizing) return;
      const dw = ev.clientX - resizeRef.current.startX;
      const dh = ev.clientY - resizeRef.current.startY;
      const ed = resizeRef.current.edge;
      let newW = resizeRef.current.startW;
      let newH = resizeRef.current.startH;
      if (ed.includes('e')) newW += dw;
      if (ed.includes('w')) newW -= dw;
      if (ed.includes('s')) newH += dh;
      if (ed.includes('n')) newH -= dh;
      resizeWindow(win.id, newW, newH);
      if (ed.includes('w')) moveWindow(win.id, dragRef.current.winX || win.x + dw, win.y);
      if (ed.includes('n')) moveWindow(win.id, win.x, (dragRef.current.winY || win.y) + dh);
    };
    const onUp = () => {
      resizeRef.current.resizing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [win.id, win.x, win.y, win.width, win.height, win.maximized, focusWindow, resizeWindow, moveWindow]);

  const handleClose = () => {
    if (settings.animations) {
      setClosing(true);
      setTimeout(() => closeWindow(win.id), 150);
    } else {
      closeWindow(win.id);
    }
  };

  if (win.minimized) return null;

  const isTop = settings.taskbarPosition === 'top';
  const style: React.CSSProperties = win.maximized
    ? { left: 0, top: isTop ? 48 : 0, width: '100%', height: 'calc(100% - 48px)', zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <>
      {/* Snap preview ghost */}
      {snapPreview && (
        <div
          className="fixed z-[99990] rounded-lg border-2 border-primary/50 bg-primary/10 backdrop-blur-sm transition-all duration-200"
          style={
            snapPreview === 'left' ? { left: 4, top: isTop ? 52 : 4, width: 'calc(50% - 8px)', height: 'calc(100% - 56px)' } :
            snapPreview === 'right' ? { left: '50%', top: isTop ? 52 : 4, width: 'calc(50% - 8px)', height: 'calc(100% - 56px)', marginLeft: 4 } :
            { left: 4, top: isTop ? 52 : 4, width: 'calc(100% - 8px)', height: 'calc(100% - 56px)' }
          }
        />
      )}

      <div
        className={`absolute flex flex-col rounded-lg overflow-hidden os-window-shadow ${
          closing ? 'opacity-0 scale-95' : settings.animations ? 'animate-window-open' : ''
        } transition-[opacity,transform] duration-150`}
        style={style}
        onMouseDown={() => focusWindow(win.id)}
      >
        {/* Title bar */}
        <div
          className={`flex items-center h-9 px-3 gap-2 select-none cursor-grab active:cursor-grabbing shrink-0 ${
            win.focused ? 'bg-os-window-header' : 'bg-secondary'
          }`}
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
        {/* Resize handles - all edges */}
        {!win.maximized && (
          <>
            <div className="absolute top-0 left-2 right-2 h-1 cursor-n-resize" onMouseDown={e => onResizeStart(e, 'n')} />
            <div className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize" onMouseDown={e => onResizeStart(e, 's')} />
            <div className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize" onMouseDown={e => onResizeStart(e, 'w')} />
            <div className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize" onMouseDown={e => onResizeStart(e, 'e')} />
            <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" onMouseDown={e => onResizeStart(e, 'nw')} />
            <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" onMouseDown={e => onResizeStart(e, 'ne')} />
            <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" onMouseDown={e => onResizeStart(e, 'sw')} />
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={e => onResizeStart(e, 'se')} />
          </>
        )}
      </div>
    </>
  );
}
