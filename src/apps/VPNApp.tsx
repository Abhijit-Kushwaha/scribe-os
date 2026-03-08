import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, Power, Server, Lock, Zap } from 'lucide-react';

interface Connection {
  name: string;
  region: string;
  latency: number;
  load: number;
}

const SERVERS: Connection[] = [
  { name: 'US-East', region: '🇺🇸 New York', latency: 24, load: 45 },
  { name: 'US-West', region: '🇺🇸 Los Angeles', latency: 52, load: 32 },
  { name: 'EU-Central', region: '🇩🇪 Frankfurt', latency: 18, load: 67 },
  { name: 'EU-North', region: '🇫🇮 Helsinki', latency: 35, load: 28 },
  { name: 'Asia-East', region: '🇯🇵 Tokyo', latency: 89, load: 55 },
  { name: 'Asia-South', region: '🇸🇬 Singapore', latency: 112, load: 41 },
];

export default function VPNApp() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selected, setSelected] = useState(SERVERS[0]);
  const [uptime, setUptime] = useState(0);
  const [bytesUp, setBytesUp] = useState(0);
  const [bytesDown, setBytesDown] = useState(0);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => {
      setUptime(p => p + 1);
      setBytesUp(p => p + Math.floor(Math.random() * 50000));
      setBytesDown(p => p + Math.floor(Math.random() * 200000));
    }, 1000);
    return () => clearInterval(t);
  }, [connected]);

  const toggleConnection = useCallback(() => {
    if (connected) {
      setConnected(false);
      setUptime(0);
      setBytesUp(0);
      setBytesDown(0);
    } else {
      setConnecting(true);
      setTimeout(() => { setConnecting(false); setConnected(true); }, 1500);
    }
  }, [connected]);

  const formatBytes = (b: number) => b > 1e6 ? `${(b/1e6).toFixed(1)} MB` : `${(b/1e3).toFixed(0)} KB`;
  const formatTime = (s: number) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="h-full overflow-y-auto scrollbar-os p-4">
      {/* Status */}
      <div className="text-center mb-6">
        <button
          onClick={toggleConnection}
          disabled={connecting}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-500 ${
            connected ? 'bg-primary/20 text-primary os-glow' : connecting ? 'bg-accent/20 text-accent animate-pulse' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
          }`}
        >
          <Power size={36} />
        </button>
        <div className={`text-sm font-semibold ${connected ? 'text-primary os-glow-text' : 'text-muted-foreground'}`}>
          {connecting ? 'Connecting...' : connected ? 'Connected' : 'Disconnected'}
        </div>
        {connected && (
          <div className="text-[10px] text-muted-foreground mt-1">
            {selected.region} • {formatTime(uptime)}
          </div>
        )}
      </div>

      {/* Stats */}
      {connected && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: <Activity size={12} />, label: 'Latency', value: `${selected.latency}ms` },
            { icon: <Zap size={12} />, label: 'Upload', value: formatBytes(bytesUp) },
            { icon: <Zap size={12} />, label: 'Download', value: formatBytes(bytesDown) },
          ].map(s => (
            <div key={s.label} className="p-2 rounded-lg bg-secondary/20 text-center">
              <div className="text-primary mb-1">{s.icon}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
              <div className="text-xs font-medium">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Server list */}
      <div className="text-xs font-medium mb-2 flex items-center gap-2">
        <Server size={12} /> Servers
      </div>
      <div className="space-y-1">
        {SERVERS.map(srv => (
          <button
            key={srv.name}
            onClick={() => !connected && setSelected(srv)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-xs transition-colors ${
              selected.name === srv.name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/30'
            } ${connected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{srv.region.split(' ')[0]}</span>
            <span className="flex-1 text-left">{srv.region.split(' ').slice(1).join(' ')}</span>
            <span className="text-muted-foreground">{srv.latency}ms</span>
            <div className="w-12 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${srv.load}%` }} />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 p-2 rounded-lg bg-muted/20 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Lock size={10} /> <span>Simulated VPN — no real traffic tunneling</span>
      </div>
    </div>
  );
}
