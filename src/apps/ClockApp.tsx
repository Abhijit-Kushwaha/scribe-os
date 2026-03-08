import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Timer, Hourglass, Globe, Play, Pause, RotateCcw, Plus, Trash2 } from 'lucide-react';

const WORLD_CLOCKS = [
  { city: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
  { city: 'London', tz: 'Europe/London', flag: '🇬🇧' },
  { city: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
  { city: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
  { city: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
  { city: 'Berlin', tz: 'Europe/Berlin', flag: '🇩🇪' },
  { city: 'São Paulo', tz: 'America/Sao_Paulo', flag: '🇧🇷' },
  { city: 'Mumbai', tz: 'Asia/Kolkata', flag: '🇮🇳' },
];

const fmt2 = (n: number) => String(n).padStart(2, '0');

function AnalogClock({ size = 120, tz }: { size?: number; tz?: string }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const d = tz ? new Date(time.toLocaleString('en-US', { timeZone: tz })) : time;
  const h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds();
  const hAngle = (h + m / 60) * 30, mAngle = (m + s / 60) * 6, sAngle = s * 6;
  const r = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r - 2} fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x1 = r + Math.cos(angle) * (r - 8), y1 = r + Math.sin(angle) * (r - 8);
        const x2 = r + Math.cos(angle) * (r - 14), y2 = r + Math.sin(angle) * (r - 14);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--muted-foreground))" strokeWidth={i % 3 === 0 ? 2 : 1} />;
      })}
      {/* Hour */}
      <line x1={r} y1={r} x2={r + Math.cos((hAngle - 90) * Math.PI / 180) * (r * 0.45)} y2={r + Math.sin((hAngle - 90) * Math.PI / 180) * (r * 0.45)} stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
      {/* Minute */}
      <line x1={r} y1={r} x2={r + Math.cos((mAngle - 90) * Math.PI / 180) * (r * 0.65)} y2={r + Math.sin((mAngle - 90) * Math.PI / 180) * (r * 0.65)} stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
      {/* Second */}
      <line x1={r} y1={r} x2={r + Math.cos((sAngle - 90) * Math.PI / 180) * (r * 0.7)} y2={r + Math.sin((sAngle - 90) * Math.PI / 180) * (r * 0.7)} stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" />
      <circle cx={r} cy={r} r="3" fill="hsl(var(--primary))" />
    </svg>
  );
}

function WorldClockTab() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <div className="p-4 space-y-2">
      <div className="flex justify-center mb-4"><AnalogClock size={140} /></div>
      <div className="text-center text-2xl font-bold text-foreground mb-4 font-mono-os">
        {time.toLocaleTimeString()}
      </div>
      <div className="space-y-1">
        {WORLD_CLOCKS.map(wc => {
          const t = time.toLocaleTimeString('en-US', { timeZone: wc.tz, hour: '2-digit', minute: '2-digit', hour12: true });
          const d = time.toLocaleDateString('en-US', { timeZone: wc.tz, weekday: 'short' });
          return (
            <div key={wc.city} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20">
              <span className="text-lg">{wc.flag}</span>
              <div className="flex-1">
                <div className="text-[11px] text-foreground font-medium">{wc.city}</div>
                <div className="text-[9px] text-muted-foreground">{d}</div>
              </div>
              <span className="text-xs font-mono-os text-foreground">{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StopwatchTab() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed;
      intervalRef.current = window.setInterval(() => setElapsed(Date.now() - startRef.current), 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const fmtMs = (ms: number) => {
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), cs = Math.floor((ms % 1000) / 10);
    return `${fmt2(m)}:${fmt2(s)}.${fmt2(cs)}`;
  };

  const lap = () => setLaps(p => [elapsed, ...p]);
  const reset = () => { setRunning(false); setElapsed(0); setLaps([]); };

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="text-4xl font-mono-os font-bold text-foreground mb-6 tabular-nums">{fmtMs(elapsed)}</div>
      <div className="flex gap-3 mb-4">
        <button onClick={() => setRunning(!running)} className={`px-5 py-2 rounded-full text-xs font-medium ${running ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
          {running ? <Pause size={14} className="inline mr-1" /> : <Play size={14} className="inline mr-1" />}
          {running ? 'Stop' : 'Start'}
        </button>
        {elapsed > 0 && running && <button onClick={lap} className="px-4 py-2 rounded-full text-xs bg-secondary/30 text-foreground">Lap</button>}
        {elapsed > 0 && !running && <button onClick={reset} className="px-4 py-2 rounded-full text-xs bg-secondary/30 text-muted-foreground"><RotateCcw size={12} className="inline mr-1" />Reset</button>}
      </div>
      {laps.length > 0 && (
        <div className="w-full max-h-40 overflow-y-auto scrollbar-os">
          {laps.map((l, i) => (
            <div key={i} className="flex justify-between px-3 py-1.5 text-[11px] border-b border-border/10">
              <span className="text-muted-foreground">Lap {laps.length - i}</span>
              <span className="font-mono-os text-foreground">{fmtMs(l - (laps[i + 1] || 0))}</span>
              <span className="font-mono-os text-muted-foreground">{fmtMs(l)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimerTab() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<number>();

  const totalSecs = hours * 3600 + minutes * 60 + seconds;

  const start = () => { if (totalSecs > 0) { setRemaining(totalSecs); setRunning(true); setFinished(false); } };

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = window.setInterval(() => {
      setRemaining(p => {
        if (p <= 1) { setRunning(false); setFinished(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const fmtR = () => {
    const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60), s = remaining % 60;
    return `${fmt2(h)}:${fmt2(m)}:${fmt2(s)}`;
  };

  const pct = totalSecs > 0 ? ((totalSecs - remaining) / totalSecs) * 100 : 0;

  return (
    <div className="p-4 flex flex-col items-center">
      {!running && !finished ? (
        <>
          <div className="flex items-center gap-2 mb-6">
            {[
              { label: 'H', value: hours, set: setHours, max: 23 },
              { label: 'M', value: minutes, set: setMinutes, max: 59 },
              { label: 'S', value: seconds, set: setSeconds, max: 59 },
            ].map(({ label, value, set, max }) => (
              <div key={label} className="flex flex-col items-center">
                <button onClick={() => set(v => Math.min(max, v + 1))} className="text-muted-foreground hover:text-foreground text-lg">▲</button>
                <div className="text-3xl font-mono-os font-bold text-foreground w-14 text-center">{fmt2(value)}</div>
                <button onClick={() => set(v => Math.max(0, v - 1))} className="text-muted-foreground hover:text-foreground text-lg">▼</button>
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <button onClick={start} disabled={totalSecs === 0} className="px-6 py-2 rounded-full bg-primary/20 text-primary text-xs disabled:opacity-30">
            <Play size={14} className="inline mr-1" />Start
          </button>
        </>
      ) : (
        <>
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={finished ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-mono-os font-bold ${finished ? 'text-destructive animate-pulse' : 'text-foreground'}`}>{fmtR()}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRunning(!running)} className={`px-4 py-2 rounded-full text-xs ${running ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
              {running ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => { setRunning(false); setRemaining(0); setFinished(false); }} className="px-4 py-2 rounded-full text-xs bg-secondary/30 text-muted-foreground">Cancel</button>
          </div>
          {finished && <div className="mt-3 text-sm text-destructive font-medium animate-pulse">⏰ Time's up!</div>}
        </>
      )}
    </div>
  );
}

const TABS = [
  { id: 'world', label: 'World Clock', icon: Globe },
  { id: 'stopwatch', label: 'Stopwatch', icon: Timer },
  { id: 'timer', label: 'Timer', icon: Hourglass },
] as const;

export default function ClockApp({ windowId }: { windowId: string }) {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('world');

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      <div className="flex border-b border-border/30 bg-secondary/20">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-center text-[11px] flex items-center justify-center gap-1.5 transition-colors ${tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-os">
        {tab === 'world' && <WorldClockTab />}
        {tab === 'stopwatch' && <StopwatchTab />}
        {tab === 'timer' && <TimerTab />}
      </div>
    </div>
  );
}
