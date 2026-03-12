import React, { useState, useCallback } from 'react';

interface ScanResult {
  id: string;
  subdomain: string;
  ip: string;
  status: number;
  tech: string[];
  timestamp: number;
}

interface ScanProfile {
  name: string;
  tools: string[];
  description: string;
}

const SCAN_PROFILES: ScanProfile[] = [
  { name: 'Quick Recon', tools: ['subfinder', 'httpx'], description: 'Fast subdomain enum + probe' },
  { name: 'Deep Scan', tools: ['subfinder', 'httpx', 'nuclei', 'gau'], description: 'Full recon pipeline' },
  { name: 'Fuzz & Crawl', tools: ['ffuf', 'katana', 'gau'], description: 'Directory fuzzing + crawling' },
  { name: 'Vuln Scan', tools: ['nuclei', 'sqlmap'], description: 'Vulnerability detection' },
];

const TOOL_COLORS: Record<string, string> = {
  subfinder: '#00e5ff', httpx: '#76ff03', nuclei: '#ff6e40',
  gau: '#e040fb', katana: '#ffab40', ffuf: '#40c4ff', sqlmap: '#ff5252',
};

export default function ReconNexus({ windowId }: { windowId: string }) {
  const [target, setTarget] = useState('');
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const runScan = useCallback(() => {
    if (!target.trim() || scanning) return;
    const profile = SCAN_PROFILES.find(p => p.name === activeProfile);
    if (!profile) return;

    setScanning(true);
    setLogs([`[*] Target: ${target}`, `[*] Profile: ${profile.name}`, `[*] Tools: ${profile.tools.join(', ')}`, '']);

    const subs = ['api', 'dev', 'staging', 'admin', 'mail', 'cdn', 'app', 'auth', 'dashboard', 'docs', 'beta', 'test', 'portal', 'status'];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= subs.length) {
        clearInterval(interval);
        setScanning(false);
        setLogs(l => [...l, '', `[✓] Scan complete. ${subs.length} subdomains found.`]);
        return;
      }
      const sub = subs[i];
      const result: ScanResult = {
        id: crypto.randomUUID(),
        subdomain: `${sub}.${target}`,
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        status: [200, 301, 403, 404, 500][Math.floor(Math.random() * 5)],
        tech: ['nginx', 'cloudflare', 'express', 'apache', 'react'].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1),
        timestamp: Date.now(),
      };
      setResults(r => [...r, result]);
      setLogs(l => [...l, `[${profile.tools[i % profile.tools.length]}] Found: ${result.subdomain} → ${result.ip} [${result.status}]`]);
      i++;
    }, 300);
  }, [target, activeProfile, scanning]);

  const statusColor = (s: number) => s < 300 ? '#76ff03' : s < 400 ? '#ffab40' : s < 500 ? '#ff6e40' : '#ff5252';

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-terminal-bg))] text-[hsl(var(--foreground))] font-mono-os text-xs overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[hsl(var(--border))] flex gap-2 items-center">
        <span className="text-base">🔍</span>
        <span className="font-bold text-sm" style={{ color: 'hsl(var(--os-terminal-cyan))' }}>ReconNexus</span>
        <div className="flex-1" />
        <span className="text-[hsl(var(--muted-foreground))]">{results.length} results</span>
      </div>

      {/* Target input */}
      <div className="p-3 border-b border-[hsl(var(--border))] flex gap-2">
        <input
          className="flex-1 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded px-2 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus:border-[hsl(var(--primary))]"
          placeholder="target.com"
          value={target}
          onChange={e => setTarget(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runScan()}
        />
        <button
          onClick={runScan}
          disabled={scanning || !target.trim() || !activeProfile}
          className="px-3 py-1.5 rounded text-xs font-bold disabled:opacity-40"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          {scanning ? '⟳ Scanning...' : '▶ Launch'}
        </button>
      </div>

      {/* Profiles */}
      <div className="p-2 border-b border-[hsl(var(--border))] flex gap-2 overflow-x-auto">
        {SCAN_PROFILES.map(p => (
          <button
            key={p.name}
            onClick={() => setActiveProfile(p.name)}
            className="px-2 py-1 rounded text-[10px] whitespace-nowrap border transition-all"
            style={{
              borderColor: activeProfile === p.name ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              background: activeProfile === p.name ? 'hsl(var(--primary) / 0.15)' : 'transparent',
              color: activeProfile === p.name ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
          >
            {p.name}
            <span className="ml-1 opacity-60">({p.tools.length})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Results table */}
        <div className="flex-1 overflow-auto scrollbar-os">
          {results.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
              Select a profile and enter a target to begin
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                  <th className="text-left p-2">Subdomain</th>
                  <th className="text-left p-2">IP</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Tech</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                    <td className="p-2" style={{ color: 'hsl(var(--os-terminal-cyan))' }}>{r.subdomain}</td>
                    <td className="p-2 text-[hsl(var(--muted-foreground))]">{r.ip}</td>
                    <td className="p-2"><span style={{ color: statusColor(r.status) }}>{r.status}</span></td>
                    <td className="p-2 flex gap-1 flex-wrap">
                      {r.tech.map(t => (
                        <span key={t} className="px-1 rounded text-[9px]" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>{t}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Log panel */}
        <div className="w-64 border-l border-[hsl(var(--border))] overflow-auto scrollbar-os p-2 bg-[hsl(var(--background))]">
          <div className="text-[hsl(var(--muted-foreground))] mb-1 text-[10px] font-bold">LIVE LOG</div>
          {logs.map((l, i) => (
            <div key={i} className="leading-4" style={{ color: l.startsWith('[✓]') ? 'hsl(var(--os-terminal-green))' : l.startsWith('[*]') ? 'hsl(var(--os-terminal-cyan))' : 'hsl(var(--muted-foreground))' }}>
              {l || '\u00A0'}
            </div>
          ))}
          {scanning && <span className="animate-blink" style={{ color: 'hsl(var(--os-terminal-green))' }}>█</span>}
        </div>
      </div>
    </div>
  );
}
