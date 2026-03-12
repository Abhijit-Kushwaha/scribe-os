import { useState, useCallback, useEffect } from 'react';

export interface OSSettings {
  username: string;
  wallpaper: 'default' | 'custom' | 'gradient-blue' | 'gradient-purple' | 'gradient-green' | 'solid-dark' | 'solid-black';
  accentColor: 'cyan' | 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';
  fontSize: 'small' | 'medium' | 'large';
  taskbarPosition: 'bottom' | 'top';
  showSeconds: boolean;
  use24Hour: boolean;
  animations: boolean;
  transparency: boolean;
  cursorBlink: boolean;
  notificationSound: boolean;
  autoLock: boolean;
  screenBrightness: number;
  volume: number;
}

const DEFAULT_SETTINGS: OSSettings = {
  username: 'Scribe',
  wallpaper: 'default',
  accentColor: 'cyan',
  fontSize: 'medium',
  taskbarPosition: 'bottom',
  showSeconds: false,
  use24Hour: false,
  animations: true,
  transparency: true,
  cursorBlink: true,
  notificationSound: true,
  autoLock: false,
  screenBrightness: 100,
  volume: 75,
};

const STORAGE_KEY = 'scribe-os-settings';

export function useOSSettings() {
  const [settings, setSettings] = useState<OSSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof OSSettings>(key: K, value: OSSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSetting, resetSettings };
}

export const ACCENT_COLORS: Record<OSSettings['accentColor'], { hsl: string; label: string; tw: string }> = {
  cyan:   { hsl: '174 72% 46%', label: 'Cyan',   tw: 'bg-cyan-500' },
  blue:   { hsl: '217 91% 60%', label: 'Blue',   tw: 'bg-blue-500' },
  purple: { hsl: '271 76% 53%', label: 'Purple', tw: 'bg-purple-500' },
  green:  { hsl: '142 71% 45%', label: 'Green',  tw: 'bg-green-500' },
  orange: { hsl: '25 95% 53%',  label: 'Orange', tw: 'bg-orange-500' },
  red:    { hsl: '0 72% 51%',   label: 'Red',    tw: 'bg-red-500' },
  pink:   { hsl: '330 81% 60%', label: 'Pink',   tw: 'bg-pink-500' },
};

export const WALLPAPERS: Record<OSSettings['wallpaper'], { label: string; css: string }> = {
  'default':         { label: 'Default Image', css: '' },
  'gradient-blue':   { label: 'Ocean Blue',    css: 'linear-gradient(135deg, hsl(210 80% 15%) 0%, hsl(220 60% 25%) 50%, hsl(200 70% 20%) 100%)' },
  'gradient-purple': { label: 'Deep Purple',   css: 'linear-gradient(135deg, hsl(270 50% 12%) 0%, hsl(280 60% 22%) 50%, hsl(300 40% 15%) 100%)' },
  'gradient-green':  { label: 'Forest',        css: 'linear-gradient(135deg, hsl(150 40% 10%) 0%, hsl(160 50% 18%) 50%, hsl(140 35% 12%) 100%)' },
  'solid-dark':      { label: 'Dark Gray',     css: 'hsl(210 15% 10%)' },
  'solid-black':     { label: 'Pure Black',    css: 'hsl(0 0% 3%)' },
};
