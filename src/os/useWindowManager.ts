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
      w.id === id ? { ...w, maximized: !w.maximized, focused: true, zIndex: ++nextZ } : { ...w, focused: false }
    ));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, focused: true, zIndex: ++nextZ, minimized: false } : { ...w, focused: false }
    ));
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width: Math.max(300, width), height: Math.max(200, height) } : w));
  }, []);

  return { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow };
}
