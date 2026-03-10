import React, { useState } from 'react';
import { useOS } from '@/os/OSContext';
import { ACCENT_COLORS, WALLPAPERS, OSSettings } from '@/os/useOSSettings';
import {
  Monitor, Cpu, HardDrive, Wifi, Shield, Palette, User, Clock,
  Volume2, Sun, Eye, MousePointer, Bell, Lock, RotateCcw, ChevronRight,
  Layers, Sparkles
} from 'lucide-react';

type Section = 'system' | 'appearance' | 'personalization' | 'datetime' | 'sound' | 'accessibility' | 'privacy' | 'about';

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
  { id: 'personalization', label: 'Personalization', icon: <Sparkles size={15} /> },
  { id: 'system', label: 'System', icon: <Monitor size={15} /> },
  { id: 'datetime', label: 'Date & Time', icon: <Clock size={15} /> },
  { id: 'sound', label: 'Sound', icon: <Volume2 size={15} /> },
  { id: 'accessibility', label: 'Accessibility', icon: <Eye size={15} /> },
  { id: 'privacy', label: 'Privacy', icon: <Lock size={15} /> },
  { id: 'about', label: 'About', icon: <Shield size={15} /> },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function Slider({ value, onChange, min = 0, max = 100 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background"
    />
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20 last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <div className="text-xs font-medium text-foreground">{label}</div>
        {desc && <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsApp() {
  const { settings, updateSetting, resetSettings } = useOS();
  const [section, setSection] = useState<Section>('appearance');

  const renderSection = () => {
    switch (section) {
      case 'appearance':
        return (
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-3">Accent Color</h3>
            <div className="flex gap-2 mb-5">
              {(Object.entries(ACCENT_COLORS) as [OSSettings['accentColor'], typeof ACCENT_COLORS[keyof typeof ACCENT_COLORS]][]).map(([key, { label, tw }]) => (
                <button
                  key={key}
                  onClick={() => updateSetting('accentColor', key)}
                  title={label}
                  className={`w-7 h-7 rounded-full ${tw} transition-all ${
                    settings.accentColor === key ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>

            <h3 className="text-xs font-semibold text-foreground mb-3">Wallpaper</h3>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(Object.entries(WALLPAPERS) as [OSSettings['wallpaper'], typeof WALLPAPERS[keyof typeof WALLPAPERS]][]).map(([key, { label, css }]) => (
                <button
                  key={key}
                  onClick={() => updateSetting('wallpaper', key)}
                  className={`h-16 rounded-lg border-2 transition-all text-[10px] text-foreground/70 font-medium flex items-end p-1.5 ${
                    settings.wallpaper === key ? 'border-primary' : 'border-border/30 hover:border-border/60'
                  }`}
                  style={css ? { background: css } : { backgroundImage: 'url(/src/assets/wallpaper.jpg)', backgroundSize: 'cover' }}
                >
                  {label}
                </button>
              ))}
            </div>

            <SettingRow label="Transparency Effects" desc="Enable window and taskbar transparency">
              <Toggle checked={settings.transparency} onChange={v => updateSetting('transparency', v)} />
            </SettingRow>
            <SettingRow label="Animations" desc="Enable window open/close animations">
              <Toggle checked={settings.animations} onChange={v => updateSetting('animations', v)} />
            </SettingRow>
          </div>
        );

      case 'personalization':
        return (
          <div>
            <SettingRow label="Username" desc="Shown on lock screen and start menu">
              <input
                value={settings.username}
                onChange={e => updateSetting('username', e.target.value)}
                className="bg-muted rounded px-2 py-1 text-xs text-foreground outline-none w-32 border border-border/30 focus:border-primary transition-colors"
              />
            </SettingRow>
            <SettingRow label="Font Size" desc="UI text size across the system">
              <select
                value={settings.fontSize}
                onChange={e => updateSetting('fontSize', e.target.value as OSSettings['fontSize'])}
                className="bg-muted rounded px-2 py-1 text-xs text-foreground outline-none border border-border/30 focus:border-primary"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </SettingRow>
            <SettingRow label="Taskbar Position" desc="Where the taskbar appears">
              <select
                value={settings.taskbarPosition}
                onChange={e => updateSetting('taskbarPosition', e.target.value as OSSettings['taskbarPosition'])}
                className="bg-muted rounded px-2 py-1 text-xs text-foreground outline-none border border-border/30 focus:border-primary"
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
              </select>
            </SettingRow>
            <SettingRow label="Cursor Blinking" desc="Blink cursor in terminals and editors">
              <Toggle checked={settings.cursorBlink} onChange={v => updateSetting('cursorBlink', v)} />
            </SettingRow>
          </div>
        );

      case 'system':
        return (
          <div>
            <SettingRow label="Display Resolution" desc="Current viewport size">
              <span className="text-xs text-muted-foreground">{window.innerWidth}×{window.innerHeight}</span>
            </SettingRow>
            <SettingRow label="Processor" desc="Virtual CPU information">
              <span className="text-xs text-muted-foreground">{navigator.hardwareConcurrency || 4} vCPU cores</span>
            </SettingRow>
            <SettingRow label="Memory" desc="Available browser memory">
              <span className="text-xs text-muted-foreground">{(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : '8 GB'}</span>
            </SettingRow>
            <SettingRow label="Storage Backend" desc="Persistence engine">
              <span className="text-xs text-muted-foreground">IndexedDB + localStorage</span>
            </SettingRow>
            <SettingRow label="Platform" desc="Browser runtime">
              <span className="text-xs text-muted-foreground">{navigator.platform}</span>
            </SettingRow>
            <SettingRow label="Screen Brightness">
              <div className="w-28">
                <Slider value={settings.screenBrightness} onChange={v => updateSetting('screenBrightness', v)} />
              </div>
            </SettingRow>
          </div>
        );

      case 'datetime':
        return (
          <div>
            <SettingRow label="Show Seconds" desc="Display seconds in the taskbar clock">
              <Toggle checked={settings.showSeconds} onChange={v => updateSetting('showSeconds', v)} />
            </SettingRow>
            <SettingRow label="24-Hour Format" desc="Use 24-hour time instead of AM/PM">
              <Toggle checked={settings.use24Hour} onChange={v => updateSetting('use24Hour', v)} />
            </SettingRow>
            <SettingRow label="Current Time">
              <span className="text-xs text-muted-foreground font-mono">{new Date().toLocaleTimeString()}</span>
            </SettingRow>
            <SettingRow label="Time Zone">
              <span className="text-xs text-muted-foreground">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </SettingRow>
          </div>
        );

      case 'sound':
        return (
          <div>
            <SettingRow label="Volume">
              <div className="w-28 flex items-center gap-2">
                <Slider value={settings.volume} onChange={v => updateSetting('volume', v)} />
                <span className="text-[11px] text-muted-foreground w-6 text-right">{settings.volume}</span>
              </div>
            </SettingRow>
            <SettingRow label="Notification Sounds" desc="Play sounds for system notifications">
              <Toggle checked={settings.notificationSound} onChange={v => updateSetting('notificationSound', v)} />
            </SettingRow>
          </div>
        );

      case 'accessibility':
        return (
          <div>
            <SettingRow label="Font Size" desc="System-wide text scaling">
              <select
                value={settings.fontSize}
                onChange={e => updateSetting('fontSize', e.target.value as OSSettings['fontSize'])}
                className="bg-muted rounded px-2 py-1 text-xs text-foreground outline-none border border-border/30 focus:border-primary"
              >
                <option value="small">Small (12px)</option>
                <option value="medium">Medium (14px)</option>
                <option value="large">Large (16px)</option>
              </select>
            </SettingRow>
            <SettingRow label="Reduce Animations" desc="Minimize motion effects">
              <Toggle checked={!settings.animations} onChange={v => updateSetting('animations', !v)} />
            </SettingRow>
            <SettingRow label="High Contrast" desc="Not yet implemented">
              <Toggle checked={false} onChange={() => {}} />
            </SettingRow>
          </div>
        );

      case 'privacy':
        return (
          <div>
            <SettingRow label="Auto Lock" desc="Lock screen when idle">
              <Toggle checked={settings.autoLock} onChange={v => updateSetting('autoLock', v)} />
            </SettingRow>
            <SettingRow label="Sandbox Mode" desc="All apps run in browser sandbox">
              <span className="text-xs text-primary font-medium">Active</span>
            </SettingRow>
            <SettingRow label="Encryption" desc="Storage encryption status">
              <span className="text-xs text-muted-foreground">AES-256-GCM</span>
            </SettingRow>
          </div>
        );

      case 'about':
        return (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-3xl">🖥️</div>
              <div>
                <div className="text-sm font-semibold text-foreground">Scribe OS</div>
                <div className="text-[11px] text-muted-foreground">Kali Edition v2.0</div>
              </div>
            </div>
            <SettingRow label="Build" desc="Release version">
              <span className="text-xs text-muted-foreground">6.1.0-kali9-amd64</span>
            </SettingRow>
            <SettingRow label="Kernel" desc="System kernel">
              <span className="text-xs text-muted-foreground">WebAssembly vCPU</span>
            </SettingRow>
            <SettingRow label="Runtime" desc="Browser engine">
              <span className="text-xs text-muted-foreground">{navigator.userAgent.split(' ').pop()}</span>
            </SettingRow>
            <SettingRow label="Network" desc="Connection status">
              <span className={`text-xs font-medium ${navigator.onLine ? 'text-primary' : 'text-destructive'}`}>
                {navigator.onLine ? 'Connected' : 'Offline'}
              </span>
            </SettingRow>

            <div className="mt-4 pt-3 border-t border-border/20">
              <button
                onClick={resetSettings}
                className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                <RotateCcw size={12} />
                Reset all settings to defaults
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar nav */}
      <div className="w-[160px] shrink-0 border-r border-border/20 bg-secondary/10 overflow-y-auto scrollbar-os py-2">
        <div className="px-3 py-2 mb-1">
          <h2 className="text-xs font-semibold text-foreground">Settings</h2>
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors ${
              section === item.id
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {section === item.id && <ChevronRight size={10} className="ml-auto" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-os p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 capitalize">{section === 'datetime' ? 'Date & Time' : section}</h3>
        {renderSection()}
      </div>
    </div>
  );
}
