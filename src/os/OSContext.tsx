import React, { createContext, useContext, ReactNode } from 'react';
import { useWindowManager } from './useWindowManager';
import { useFileSystem } from './useFileSystem';
import { useOSSettings, OSSettings } from './useOSSettings';

type WM = ReturnType<typeof useWindowManager>;
type FS = ReturnType<typeof useFileSystem>;

interface OSContextType extends WM, FS {
  settings: OSSettings;
  updateSetting: <K extends keyof OSSettings>(key: K, value: OSSettings[K]) => void;
  resetSettings: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onShutdown?: () => void;
}

const OSContext = createContext<OSContextType | null>(null);

export function OSProvider({ children, onSleep, onRestart, onShutdown }: { children: ReactNode; onSleep?: () => void; onRestart?: () => void; onShutdown?: () => void }) {
  const wm = useWindowManager();
  const fsys = useFileSystem();
  const { settings, updateSetting, resetSettings } = useOSSettings();
  return <OSContext.Provider value={{ ...wm, ...fsys, settings, updateSetting, resetSettings, onSleep, onRestart, onShutdown }}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
}
