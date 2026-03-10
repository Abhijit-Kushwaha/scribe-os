import { useState, useCallback } from 'react';
import { OSWindow } from './types';

let nextZ = 10;

export function useWindowManager() {
  const [windows, setWindows] = useState<OSWindow[]>([]);

  const openWindow = useCallback((appId: string, title: string, w = 700, h = 500) => {
    setWindows(prev => {
      if (prev.find(win => win.appId === appId && !win.minimized)) {
        return prev.map(win =>
          win.appId === appId ? { ...win, focused: true, minimized: false, zIndex: ++nextZ } : { ...win, focused: false }
        );
      }
      const existing = prev.find(win => win.appId === appId);
      if (existing) {
        return prev.map(win =>
          win.id === existing.id ? { ...win, minimized: false, focused: true, zIndex: ++nextZ } : { ...win, focused: false }
        );
      }
      const id = `${appId}-${Date.now()}`;
      const offset = (prev.length % 5) * 30;
      const newWin: OSWindow = {
        id, appId, title,
        x: 100 + offset, y: 60 + offset,
        width: w, height: h,
        minimized: false, maximized: false, focused: true,
        zIndex: ++nextZ,
        snapped: undefined,
      };
      return [...prev.map(w => ({ ...w, focused: false })), newWin];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true, focused: false } : w));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, maximized: !w.maximized, snapped: undefined, focused: true, zIndex: ++nextZ } : { ...w, focused: false }
    ));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, focused: true, zIndex: ++nextZ, minimized: false } : { ...w, focused: false }
    ));
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y, snapped: undefined } : w));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width: Math.max(300, width), height: Math.max(200, height) } : w));
  }, []);

  const snapWindow = useCallback((id: string, side: 'left' | 'right' | 'maximize') => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return { ...w, focused: false };
      if (side === 'maximize') {
        return { ...w, maximized: true, snapped: undefined, focused: true, zIndex: ++nextZ };
      }
      return {
        ...w,
        x: side === 'left' ? 0 : vw / 2,
        y: 0,
        width: vw / 2,
        height: vh - 48,
        maximized: false,
        snapped: side,
        focused: true,
        zIndex: ++nextZ,
      };
    }));
  }, []);

  return { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow, snapWindow };
}
