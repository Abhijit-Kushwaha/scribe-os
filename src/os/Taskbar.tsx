import React, { useState, useEffect, useRef } from 'react';
import { useOS } from './OSContext';
import { APP_REGISTRY } from './appRegistry';
import StartMenu from './StartMenu';
import { Volume2, Wifi, Battery, ChevronUp, Calendar, X } from 'lucide-react';

function CalendarPopup({ onClose }: { onClose: () => void }) {
  const [date] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = i - firstDay + 1;
    return d > 0 && d <= daysInMonth ? d : 0;
  });

  return (
    <div className="w-64 os-glass rounded-xl p-3 os-window-shadow animate-slide-up" onClick={e => e.stopPropagation()}>
      <div className="text-xs font-semibold text-foreground mb-2">
        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-7 gap-0 text-center text-[9px]">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((d, i) => (
          <div
            key={i}
            className={`py-1 rounded ${
              d === today ? 'bg-primary text-primary-foreground font-bold' :
              d > 0 ? 'text-foreground hover:bg-muted/30 cursor-pointer' : ''
            }`}
          >
            {d > 0 ? d : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function VolumePopup({ volume, onChange, onClose }: { volume: number; onChange: (v: number) => void; onClose: () => void }) {
  return (
    <div className="w-48 os-glass rounded-xl p-3 os-window-shadow animate-slide-up" onClick={e => e.stopPropagation()}>
      <div className="text-[10px] text-muted-foreground mb-2">Volume</div>
      <div className="flex items-center gap-2">
        <Volume2 size={12} className="text-primary shrink-0" />
        <input
          type="range"
          min={0} max={100} value={volume}
          onChange={e => onChange(+e.target.value)}
          className="flex-1 h-1 accent-primary appearance-none bg-muted/30 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
        <span className="text-[10px] text-foreground w-6 text-right">{volume}</span>
      </div>
    </div>
  );
}

function WifiPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="w-52 os-glass rounded-xl p-3 os-window-shadow animate-slide-up" onClick={e => e.stopPropagation()}>
      <div className="text-[10px] text-muted-foreground mb-2">Wi-Fi</div>
      {[
        { name: 'ScribeOS-WiFi-5G', connected: true, strength: 4 },
        { name: 'Neighbor_Network', connected: false, strength: 3 },
        { name: 'CoffeeShop-Free', connected: false, strength: 2 },
      ].map(n => (
        <div key={n.name} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] ${n.connected ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/20'} cursor-pointer`}>
          <Wifi size={12} className={n.connected ? 'text-primary' : ''} />
          <span className="flex-1">{n.name}</span>
          {n.connected && <span className="text-[9px] text-primary">Connected</span>}
          <div className="flex gap-[1px]">
            {[1, 2, 3, 4].map(b => (
              <div key={b} className={`w-[3px] rounded-sm ${b <= n.strength ? (n.connected ? 'bg-primary' : 'bg-muted-foreground') : 'bg-muted/30'}`} style={{ height: 3 + b * 2 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Taskbar() {
  const { windows, focusWindow, minimizeWindow, settings, updateSetting } = useOS();
  const [time, setTime] = useState(new Date());
  const [startOpen, setStartOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showWifi, setShowWifi] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleTaskbarClick = (id: string, minimized: boolean) => {
    if (minimized) focusWindow(id);
    else minimizeWindow(id);
  };

  const closeAllPopups = () => {
    setShowCalendar(false);
    setShowVolume(false);
    setShowWifi(false);
  };

  const isTop = settings.taskbarPosition === 'top';

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(settings.showSeconds ? { second: '2-digit' } : {}),
    hour12: !settings.use24Hour,
  };

  return (
    <>
      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}

      {/* Popup overlays */}
      {(showCalendar || showVolume || showWifi) && (
        <div className="fixed inset-0" style={{ zIndex: 9997 }} onClick={closeAllPopups}>
          <div className={`absolute right-2 ${isTop ? 'top-14' : 'bottom-14'} flex flex-col gap-2 items-end`}>
            {showVolume && <VolumePopup volume={settings.volume} onChange={v => updateSetting('volume', v)} onClose={closeAllPopups} />}
            {showWifi && <WifiPopup onClose={closeAllPopups} />}
            {showCalendar && <CalendarPopup onClose={closeAllPopups} />}
          </div>
        </div>
      )}

      <div
        className={`absolute left-0 right-0 h-12 ${settings.transparency ? 'taskbar-blur' : 'bg-[hsl(var(--os-taskbar))]'} border-border/30 flex items-center px-2 gap-1 ${
          isTop ? 'top-0 border-b' : 'bottom-0 border-t'
        }`}
        style={{ zIndex: 9999 }}
      >
        {/* Start button */}
        <button
          onClick={() => { setStartOpen(!startOpen); closeAllPopups(); }}
          className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all ${startOpen ? 'bg-primary/20 text-primary' : 'hover:bg-muted/50 text-os-taskbar-fg'}`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <rect x="2" y="2" width="9" height="9" rx="1" />
            <rect x="13" y="2" width="9" height="9" rx="1" />
            <rect x="2" y="13" width="9" height="9" rx="1" />
            <rect x="13" y="13" width="9" height="9" rx="1" />
          </svg>
        </button>

        <div className="w-px h-6 bg-border/30 mx-1" />

        {/* Open windows */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-os">
          {windows.map(win => {
            const app = APP_REGISTRY.find(a => a.id === win.appId);
            return (
              <button
                key={win.id}
                onClick={() => handleTaskbarClick(win.id, win.minimized)}
                className={`h-9 px-3 flex items-center gap-2 rounded-lg text-xs transition-all min-w-0 ${
                  win.focused && !win.minimized
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : win.minimized
                    ? 'hover:bg-muted/30 text-os-taskbar-fg/50'
                    : 'hover:bg-muted/30 text-os-taskbar-fg'
                }`}
              >
                <span className="text-sm">{app?.icon || '📄'}</span>
                <span className="truncate max-w-[100px]">{win.title}</span>
                {win.focused && !win.minimized && <div className="w-1 h-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        {/* System tray */}
        <div className="flex items-center gap-1 px-1">
          <button onClick={e => { e.stopPropagation(); closeAllPopups(); setShowVolume(!showVolume); }} className="p-1.5 rounded hover:bg-muted/30 text-os-taskbar-fg/70 transition-colors">
            <Volume2 size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); closeAllPopups(); setShowWifi(!showWifi); }} className="p-1.5 rounded hover:bg-muted/30 text-os-taskbar-fg/70 transition-colors">
            <Wifi size={14} />
          </button>
          <div className="flex items-center gap-0.5 px-1 text-os-taskbar-fg/50">
            <Battery size={14} />
            <span className="text-[9px]">87%</span>
          </div>
        </div>

        <div className="w-px h-6 bg-border/30" />

        {/* Clock */}
        <button
          onClick={e => { e.stopPropagation(); closeAllPopups(); setShowCalendar(!showCalendar); }}
          className="px-2 py-1 rounded hover:bg-muted/30 text-right transition-colors"
        >
          <div className="text-xs font-medium text-os-taskbar-fg">{time.toLocaleTimeString([], timeOptions)}</div>
          <div className="text-[10px] text-os-taskbar-fg/60">{time.toLocaleDateString()}</div>
        </button>
      </div>
    </>
  );
}
