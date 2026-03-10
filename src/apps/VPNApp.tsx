import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, Power, Server, Lock, Zap, Globe, Clock, ArrowDown, ArrowUp } from 'lucide-react';

interface Connection {
  name: string;
  region: string;
  flag: string;
  latency: number;
  load: number;
}

const SERVERS: Connection[] = [
  { name: 'US-East', region: 'New York', flag: '🇺🇸', latency: 24, load: 45 },
  { name: 'US-West', region: 'Los Angeles', flag: '🇺🇸', latency: 52, load: 32 },
  { name: 'EU-Central', region: 'Frankfurt', flag: '🇩🇪', latency: 18, load: 67 },
  { name: 'EU-North', region: 'Helsinki', flag: '🇫🇮', latency: 35, load: 28 },
  { name: 'Asia-East', region: 'Tokyo', flag: '🇯🇵', latency: 89, load: 55 },
  { name: 'Asia-South', region: 'Singapore', flag: '🇸🇬', latency: 112, load: 41 },
  { name: 'Oceania', region: 'Sydney', flag: '🇦🇺', latency: 145, load: 22 },
  { name: 'South America', region: 'São Paulo', flag: '🇧🇷', latency: 98, load: 38 },
];

const rIP = () => `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*254+1)}`;

export default function VPNApp() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selected, setSelected] = useState(SERVERS[0]);
  const [uptime, setUptime] = useState(0);
  const [bytesUp, setBytesUp] = useState(0);
  const [bytesDown, setBytesDown] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<{up:number;down:number}[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [fakeIP] = useState(rIP());
  const [killSwitch, setKillSwitch] = useState(true);
  const [tab, setTab] = useState<'status'|'servers'|'logs'>('status');

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => {
      setUptime(p => p + 1);
      const up = Math.floor(Math.random() * 80000 + 10000);
      const down = Math.floor(Math.random() * 300000 + 50000);
      setBytesUp(p => p + up);
      setBytesDown(p => p + down);
      setSpeedHistory(prev => [...prev.slice(-30), { up: up/1000, down: down/1000 }]);
    }, 1000);
    return () => clearInterval(t);
  }, [connected]);

  const toggleConnection = useCallback(() => {
    if (connected) {
      setConnected(false);
      setUptime(0);
      setBytesUp(0);
      setBytesDown(0);
      setSpeedHistory([]);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Disconnected from ${selected.region}`]);
    } else {
      setConnecting(true);
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Initiating WireGuard tunnel to ${selected.region}...`,
        `[${new Date().toLocaleTimeString()}] Resolving endpoint: vpn-${selected.name.toLowerCase()}.scribe.os`,
        `[${new Date().toLocaleTimeString()}] Handshake initiated with peer...`,
      ]);
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Handshake complete. Tunnel established.`,
          `[${new Date().toLocaleTimeString()}] Assigned IP: 10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*254+1)}`,
          `[${new Date().toLocaleTimeString()}] DNS: 10.0.0.1 (encrypted)`,
          `[${new Date().toLocaleTimeString()}] ✓ Connected to ${selected.region}`,
        ]);
        setConnecting(false);
        setConnected(true);
      }, 2000);
    }
  }, [connected, selected]);

  const formatBytes = (b: number) => b > 1e9 ? `${(b/1e9).toFixed(2)} GB` : b > 1e6 ? `${(b/1e6).toFixed(1)} MB` : `${(b/1e3).toFixed(0)} KB`;
  const formatTime = (s: number) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // Mini sparkline
  const maxSpeed = Math.max(1, ...speedHistory.map(s => Math.max(s.up, s.down)));
  const sparkH = 40;

  return (
    <div className="h-full flex flex-col text-xs">
      {/* Tabs */}
      <div className="flex border-b border-border/30 bg-secondary/20">
        {(['status','servers','logs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-center capitalize transition-colors ${tab===t?'text-primary border-b-2 border-primary':'text-muted-foreground hover:text-foreground'}`}
          >{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-os p-4">
        {tab === 'status' && (
          <>
            {/* Power button */}
            <div className="text-center mb-4">
              <button
                onClick={toggleConnection}
                disabled={connecting}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 transition-all duration-500 ${
                  connected ? 'bg-primary/20 text-primary os-glow' : connecting ? 'bg-accent/20 text-accent animate-pulse' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Power size={32} />
              </button>
              <div className={`text-sm font-bold ${connected ? 'text-primary os-glow-text' : 'text-muted-foreground'}`}>
                {connecting ? 'Establishing tunnel...' : connected ? 'PROTECTED' : 'UNPROTECTED'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {connected ? `${selected.flag} ${selected.region} • ${formatTime(uptime)}` : 'Tap to connect'}
              </div>
            </div>

            {/* IP Display */}
            <div className={`p-3 rounded-lg mb-3 ${connected ? 'bg-primary/5 border border-primary/20' : 'bg-destructive/5 border border-destructive/20'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Globe size={12} className={connected ? 'text-primary' : 'text-destructive'} />
                <span className="text-muted-foreground">Your IP Address</span>
              </div>
              <div className={`font-mono text-sm font-bold ${connected ? 'text-primary' : 'text-destructive'}`}>
                {connected ? fakeIP : '⚠️ Exposed'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {connected ? `Location: ${selected.region} | Encrypted: AES-256` : 'Your real IP is visible to websites'}
              </div>
            </div>

            {/* Stats grid */}
            {connected && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1"><ArrowUp size={10} /> Upload</div>
                    <div className="font-bold text-sm">{formatBytes(bytesUp)}</div>
                    <div className="text-[10px] text-muted-foreground">{speedHistory.length?`${speedHistory[speedHistory.length-1].up.toFixed(0)} KB/s`:'-'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1"><ArrowDown size={10} /> Download</div>
                    <div className="font-bold text-sm">{formatBytes(bytesDown)}</div>
                    <div className="text-[10px] text-muted-foreground">{speedHistory.length?`${speedHistory[speedHistory.length-1].down.toFixed(0)} KB/s`:'-'}</div>
                  </div>
                </div>

                {/* Speed graph */}
                <div className="p-3 rounded-lg bg-secondary/10 mb-3">
                  <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1"><Activity size={10} /> Network Activity</div>
                  <svg viewBox={`0 0 ${Math.max(speedHistory.length,30)} ${sparkH}`} className="w-full h-10" preserveAspectRatio="none">
                    {/* Download line */}
                    <polyline
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1.5"
                      points={speedHistory.map((s,i)=>`${i},${sparkH-s.down/maxSpeed*sparkH}`).join(' ')}
                    />
                    {/* Upload line */}
                    <polyline
                      fill="none"
                      stroke="hsl(var(--os-terminal-green))"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      points={speedHistory.map((s,i)=>`${i},${sparkH-s.up/maxSpeed*sparkH}`).join(' ')}
                    />
                  </svg>
                  <div className="flex gap-4 mt-1 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-primary inline-block rounded" /> Download</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-os-terminal-green inline-block rounded" /> Upload</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-secondary/20 text-center">
                    <div className="text-muted-foreground"><Clock size={12} className="inline" /> Uptime</div>
                    <div className="font-mono font-bold">{formatTime(uptime)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/20 text-center">
                    <div className="text-muted-foreground"><Zap size={12} className="inline" /> Latency</div>
                    <div className="font-mono font-bold">{selected.latency}ms</div>
                  </div>
                </div>
              </>
            )}

            {/* Kill switch */}
            <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-secondary/10">
              <div className="flex items-center gap-2">
                <Shield size={12} className={killSwitch ? 'text-primary' : 'text-muted-foreground'} />
                <span>Kill Switch</span>
              </div>
              <button
                onClick={() => setKillSwitch(!killSwitch)}
                className={`w-9 h-5 rounded-full transition-colors relative ${killSwitch ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-transform ${killSwitch ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </>
        )}

        {tab === 'servers' && (
          <div className="space-y-1">
            {SERVERS.map(srv => (
              <button
                key={srv.name}
                onClick={() => !connected && setSelected(srv)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selected.name===srv.name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/30'
                } ${connected?'opacity-50 cursor-not-allowed':''}`}
              >
                <span className="text-lg">{srv.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{srv.region}</div>
                  <div className="text-[10px] text-muted-foreground">{srv.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">{srv.latency}ms</div>
                  <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden mt-1">
                    <div className={`h-full rounded-full ${srv.load>60?'bg-destructive/60':srv.load>40?'bg-accent/60':'bg-primary/60'}`} style={{width:`${srv.load}%`}} />
                  </div>
                </div>
                {selected.name===srv.name && connected && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </button>
            ))}
          </div>
        )}

        {tab === 'logs' && (
          <div className="font-mono text-[11px] space-y-0.5">
            {logs.length===0 && <div className="text-muted-foreground text-center mt-8">No connection logs yet</div>}
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('✓')?'text-os-terminal-green':log.includes('Error')?'text-destructive':'text-muted-foreground'}`}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 bg-secondary/20 border-t border-border/30 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Lock size={9} />
        <span>WireGuard® Protocol • Simulated tunnel</span>
      </div>
    </div>
  );
}
