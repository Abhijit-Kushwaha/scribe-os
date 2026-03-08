import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, MemoryStick, Monitor, Wifi, Shield, Clock, Zap, Layers, Terminal } from 'lucide-react';

const ASCII_ART = `
  ██████╗ ██████╗██████╗ ██╗██████╗ ███████╗
  ██╔════╝██╔════╝██╔══██╗██║██╔══██╗██╔════╝
  ███████╗██║     ██████╔╝██║██████╔╝█████╗  
  ╚════██║██║     ██╔══██╗██║██╔══██╗██╔══╝  
  ██████║╚██████╗██║  ██║██║██████╔╝███████╗
  ╚═════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═════╝╚══════╝`;

const ASCII_LOGO = `
       ╔══════════╗
       ║  ▓▓▓▓▓▓  ║
       ║  ▓ SC ▓  ║
       ║  ▓▓▓▓▓▓  ║
       ╚══════════╝`;

export default function SystemInfoApp({ windowId }: { windowId: string }) {
  const [uptime, setUptime] = useState(0);
  const [view, setView] = useState<'neofetch' | 'detailed'>('neofetch');

  useEffect(() => {
    const t = setInterval(() => setUptime(Math.floor(performance.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtUptime = () => {
    const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = uptime % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const cores = navigator.hardwareConcurrency || 4;
  const lang = navigator.language;
  const platform = navigator.platform;
  const ua = navigator.userAgent;
  const mem = (navigator as any).deviceMemory || 8;
  const screenW = window.screen.width, screenH = window.screen.height;
  const colorDepth = window.screen.colorDepth;
  const online = navigator.onLine;
  const cookieEnabled = navigator.cookieEnabled;
  const pdfViewerEnabled = navigator.pdfViewerEnabled;

  const neofetchLines = [
    { label: 'OS', value: 'ScribeOS 2.0 Kali Edition x86_64' },
    { label: 'Host', value: 'Browser Virtual Machine' },
    { label: 'Kernel', value: '6.1.0-kali9-amd64' },
    { label: 'Uptime', value: fmtUptime() },
    { label: 'Packages', value: '2847 (apt), 156 (npm)' },
    { label: 'Shell', value: 'bash 5.2.15' },
    { label: 'Resolution', value: `${screenW}x${screenH}` },
    { label: 'DE', value: 'ScribeWM 2.0' },
    { label: 'WM', value: 'React Window Manager' },
    { label: 'Theme', value: 'Kali Dark [GTK2/3]' },
    { label: 'Icons', value: 'Papirus-Dark [GTK2/3]' },
    { label: 'Terminal', value: 'xterm.js v6' },
    { label: 'CPU', value: `WebAssembly vCPU (${cores}) @ 3.6GHz` },
    { label: 'GPU', value: 'WebGPU Virtual Adapter' },
    { label: 'Memory', value: `${Math.floor(Math.random() * 2000 + 2000)}MiB / ${mem * 1024}MiB` },
  ];

  const detailedInfo = [
    { icon: <Monitor size={14} />, category: 'Display', items: [
      { label: 'Resolution', value: `${screenW}×${screenH}` },
      { label: 'Color Depth', value: `${colorDepth}-bit` },
      { label: 'Pixel Ratio', value: `${window.devicePixelRatio}x` },
      { label: 'Viewport', value: `${window.innerWidth}×${window.innerHeight}` },
    ]},
    { icon: <Cpu size={14} />, category: 'Processor', items: [
      { label: 'Cores', value: `${cores} logical` },
      { label: 'Architecture', value: 'x86_64 (emulated)' },
      { label: 'Platform', value: platform },
    ]},
    { icon: <MemoryStick size={14} />, category: 'Memory', items: [
      { label: 'Device Memory', value: `${mem} GB` },
      { label: 'JS Heap', value: `${((performance as any).memory?.usedJSHeapSize / 1e6 || 0).toFixed(1)} MB` },
    ]},
    { icon: <Wifi size={14} />, category: 'Network', items: [
      { label: 'Status', value: online ? 'Online' : 'Offline' },
      { label: 'Connection', value: (navigator as any).connection?.effectiveType || 'Unknown' },
      { label: 'Language', value: lang },
    ]},
    { icon: <Shield size={14} />, category: 'Security', items: [
      { label: 'Cookies', value: cookieEnabled ? 'Enabled' : 'Disabled' },
      { label: 'PDF Viewer', value: pdfViewerEnabled ? 'Built-in' : 'None' },
      { label: 'Secure Context', value: window.isSecureContext ? 'Yes' : 'No' },
    ]},
  ];

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-terminal-bg))]">
      <div className="flex border-b border-border/30 bg-secondary/20">
        <button onClick={() => setView('neofetch')} className={`flex-1 py-2 text-center text-[11px] flex items-center justify-center gap-1.5 ${view === 'neofetch' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
          <Terminal size={12} />neofetch
        </button>
        <button onClick={() => setView('detailed')} className={`flex-1 py-2 text-center text-[11px] flex items-center justify-center gap-1.5 ${view === 'detailed' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
          <Layers size={12} />Detailed
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-os p-4 font-mono-os text-xs">
        {view === 'neofetch' ? (
          <div className="flex gap-4">
            {/* ASCII Logo */}
            <pre className="text-primary text-[10px] leading-tight shrink-0 whitespace-pre">{ASCII_LOGO}</pre>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-primary font-bold mb-0.5">root@scribe-os</div>
              <div className="text-muted-foreground mb-2">{'─'.repeat(20)}</div>
              {neofetchLines.map(l => (
                <div key={l.label} className="flex gap-1 leading-5">
                  <span className="text-primary font-bold shrink-0">{l.label}:</span>
                  <span className="text-foreground/80 truncate">{l.value}</span>
                </div>
              ))}
              {/* Color blocks */}
              <div className="flex gap-0 mt-3">
                {['#2e3436', '#cc0000', '#4e9a06', '#c4a000', '#3465a4', '#75507b', '#06989a', '#d3d7cf'].map(c => (
                  <div key={c} className="w-4 h-4" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-0">
                {['#555753', '#ef2929', '#8ae234', '#fce94f', '#729fcf', '#ad7fa8', '#34e2e2', '#eeeeec'].map(c => (
                  <div key={c} className="w-4 h-4" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {detailedInfo.map(section => (
              <div key={section.category}>
                <div className="flex items-center gap-2 text-primary font-bold mb-2">{section.icon} {section.category}</div>
                <div className="pl-6 space-y-1">
                  {section.items.map(item => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-border/20 text-[10px] text-muted-foreground">
              <div className="font-bold text-primary mb-1">User Agent</div>
              <div className="break-all">{ua}</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-1 text-[9px] text-muted-foreground border-t border-border/10 flex justify-between font-mono-os">
        <span>⚡ Uptime: {fmtUptime()}</span>
        <span>{cores} cores • {mem}GB RAM</span>
      </div>
    </div>
  );
}
