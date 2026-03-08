import React, { createContext, useContext, ReactNode } from 'react';
import { useWindowManager } from './useWindowManager';
import { useFileSystem } from './useFileSystem';

type WM = ReturnType<typeof useWindowManager>;
type FS = ReturnType<typeof useFileSystem>;

interface OSContextType extends WM, FS {}

const OSContext = createContext<OSContextType | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const wm = useWindowManager();
  const fsys = useFileSystem();
  return <OSContext.Provider value={{ ...wm, ...fsys }}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
}
