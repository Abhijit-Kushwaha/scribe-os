import React, { useState, useEffect } from 'react';

const BOOT_LINES = [
  { text: 'BIOS: Scribe UEFI v2.0', delay: 80 },
  { text: 'POST: Memory OK — 8192 MB', delay: 60 },
  { text: 'POST: CPU WebAssembly vCPU x4 @ 3.6GHz', delay: 60 },
  { text: 'POST: GPU WebGPU Virtual Adapter', delay: 40 },
  { text: '', delay: 100 },
  { text: '╔══════════════════════════════════════════════════╗', delay: 30, color: 'cyan' },
  { text: '║         SCRIBE OS — KALI EDITION v2.0           ║', delay: 30, color: 'cyan' },
  { text: '║       Browser-Native Operating System            ║', delay: 30, color: 'cyan' },
  { text: '╚══════════════════════════════════════════════════╝', delay: 30, color: 'cyan' },
  { text: '', delay: 100 },
  { text: '[  OK  ] Starting kernel...', delay: 120 },
  { text: '[  OK  ] Mounting virtual filesystem (IndexedDB)', delay: 100 },
  { text: '[  OK  ] Loading modules: crypto, network, display', delay: 90 },
  { text: '[  OK  ] Initializing window manager', delay: 80 },
  { text: '[  OK  ] Starting network stack', delay: 70 },
  { text: '[  OK  ] eth0: link up, speed 1000Mbps', delay: 60 },
  { text: '[  OK  ] DHCP: assigned 192.168.1.42/24', delay: 60 },
  { text: '[  OK  ] DNS: 8.8.8.8, 1.1.1.1', delay: 40 },
  { text: '[  OK  ] Loading security toolkit...', delay: 100 },
  { text: '         ├── nmap 7.94SVN', delay: 30 },
  { text: '         ├── sqlmap 1.7.10', delay: 30 },
  { text: '         ├── hydra 9.5', delay: 30 },
  { text: '         ├── john 1.9.0', delay: 30 },
  { text: '         ├── aircrack-ng 1.7', delay: 30 },
  { text: '         ├── metasploit 6.3.44', delay: 30 },
  { text: '         ├── nikto 2.5.0', delay: 30 },
  { text: '         └── wireshark 4.0.10', delay: 30 },
  { text: '[  OK  ] Initializing VPN subsystem', delay: 70 },
  { text: '[  OK  ] uBlock filter engine loaded (145,439 rules)', delay: 80 },
  { text: '[  OK  ] Service Worker registered', delay: 60 },
  { text: '[  OK  ] Encryption: AES-256-GCM ready', delay: 50 },
  { text: '[  OK  ] Sandbox isolation: active', delay: 50 },
  { text: '', delay: 80 },
  { text: '[  OK  ] Starting desktop environment...', delay: 200 },
  { text: '', delay: 100 },
  { text: 'ScribeOS 6.1.0-kali9-amd64 tty1', delay: 100 },
  { text: '', delay: 50 },
  { text: 'scribe-os login: root (automatic login)', delay: 150, color: 'green' },
  { text: '', delay: 200 },
  { text: '   Welcome to Scribe OS 2.0 — Kali Edition', delay: 50, color: 'cyan' },
  { text: '   All systems operational. Launching GUI...', delay: 300, color: 'cyan' },
];

interface Props {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState<typeof BOOT_LINES>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const showNext = () => {
      if (idx >= BOOT_LINES.length) {
        setTimeout(onComplete, 400);
        return;
      }
      const line = BOOT_LINES[idx];
      setVisibleLines(prev => [...prev, line]);
      setProgress(((idx + 1) / BOOT_LINES.length) * 100);
      idx++;
      timeout = setTimeout(showNext, line.delay);
    };

    // Small initial delay
    timeout = setTimeout(showNext, 300);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  const colorClass = (color?: string) => {
    switch (color) {
      case 'cyan': return 'text-os-terminal-cyan';
      case 'green': return 'text-os-terminal-green';
      default: return 'text-foreground/70';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-os-terminal-bg flex flex-col cursor-pointer"
      style={{ zIndex: 99999 }}
      onClick={onComplete}
    >
      <div className="flex-1 overflow-hidden p-6 font-mono text-xs">
        {visibleLines.map((line, i) => (
          <div key={i} className={`${colorClass(line.color)} whitespace-pre leading-5`}>
            {line.text.replace('[  OK  ]', '')}
            {line.text.startsWith('[  OK  ]') && (
              <>
                <span className="text-os-terminal-green font-bold">[  OK  ]</span>
                {line.text.slice(8)}
              </>
            )}
            {!line.text.startsWith('[  OK  ]') && line.text}
          </div>
        ))}
        <div className="animate-blink text-os-terminal-green mt-1">█</div>
      </div>
      {/* Progress bar */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1">
          <span>Boot progress</span>
          <span className="ml-auto">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[10px] text-muted-foreground/50 mt-2 text-center">Click to skip</div>
      </div>
    </div>
  );
}
