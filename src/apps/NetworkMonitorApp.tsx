import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, ArrowDown, ArrowUp, Globe } from 'lucide-react';

interface NetSample { time: string; down: number; up: number; }

export default function NetworkMonitorApp({ windowId }: { windowId: string }) {
  const [samples, setSamples] = useState<NetSample[]>([]);
  const [connected, setConnected] = useState(true);
  const [latency, setLatency] = useState(24);

  useEffect(() => {
    const tick = () => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const down = connected ? Math.random() * 80 + 20 : 0;
      const up = connected ? Math.random() * 30 + 5 : 0;
      setSamples(p => [...p.slice(-29), { time: now, down, up }]);
      setLatency(connected ? Math.floor(Math.random() * 40 + 10) : 999);
    };
    tick();
    const i = setInterval(tick, 2000);
    return () => clearInterval(i);
  }, [connected]);

  const lastDown = samples[samples.length - 1]?.down || 0;
  const lastUp = samples[samples.length - 1]?.up || 0;
  const maxVal = Math.max(...samples.map(s => Math.max(s.down, s.up)), 1);

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      {/* Status */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20">
        <div className={`p-2 rounded-lg ${connected ? 'bg-primary/10' : 'bg-destructive/10'}`}>
          {connected ? <Wifi size={20} className="text-primary" /> : <WifiOff size={20} className="text-destructive" />}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{connected ? 'Connected' : 'Disconnected'}</div>
          <div className="text-[10px] text-muted-foreground">ScribeOS-WiFi-5G • {latency}ms</div>
        </div>
        <div className="ml-auto">
          <button onClick={() => setConnected(!connected)}
            className={`px-3 py-1 rounded text-[10px] ${connected ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}>
            {connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Speed cards */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <div className="bg-secondary/20 rounded-lg p-3 text-center">
          <ArrowDown size={14} className="mx-auto text-primary mb-1" />
          <div className="text-lg font-bold text-foreground">{lastDown.toFixed(1)}</div>
          <div className="text-[9px] text-muted-foreground">Mbps ↓</div>
        </div>
        <div className="bg-secondary/20 rounded-lg p-3 text-center">
          <ArrowUp size={14} className="mx-auto text-accent mb-1" />
          <div className="text-lg font-bold text-foreground">{lastUp.toFixed(1)}</div>
          <div className="text-[9px] text-muted-foreground">Mbps ↑</div>
        </div>
        <div className="bg-secondary/20 rounded-lg p-3 text-center">
          <Activity size={14} className="mx-auto text-yellow-500 mb-1" />
          <div className="text-lg font-bold text-foreground">{latency}</div>
          <div className="text-[9px] text-muted-foreground">ms ping</div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 px-4 pb-3 flex flex-col min-h-0">
        <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-3">
          <span>Network Activity</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Download</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Upload</span>
        </div>
        <div className="flex-1 bg-secondary/10 rounded-lg p-2 flex items-end gap-[2px] min-h-[100px]">
          {samples.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-[1px]" style={{ maxWidth: '12px' }}>
              <div className="bg-primary/70 rounded-t-sm transition-all duration-500" style={{ height: `${(s.down / maxVal) * 100}%`, minHeight: s.down > 0 ? '2px' : 0 }} />
              <div className="bg-accent/70 rounded-t-sm transition-all duration-500" style={{ height: `${(s.up / maxVal) * 100}%`, minHeight: s.up > 0 ? '1px' : 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Connections */}
      <div className="border-t border-border/10 px-4 py-2">
        <div className="text-[10px] text-muted-foreground mb-1">Active Connections</div>
        <div className="space-y-0.5 text-[9px] font-mono-os text-muted-foreground">
          {['chrome.exe → 142.250.80.46:443 (google.com)', 'tor.exe → 185.220.101.1:9001 (guard)', 'node.exe → 127.0.0.1:3000 (localhost)'].map(c => (
            <div key={c} className="flex items-center gap-1"><Globe size={8} className="text-primary shrink-0" />{c}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
