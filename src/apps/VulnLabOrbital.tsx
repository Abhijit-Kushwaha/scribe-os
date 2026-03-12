import React, { useState } from 'react';

interface VulnLab {
  id: string;
  name: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  port: number;
  description: string;
  status: 'stopped' | 'running' | 'starting';
}

const LABS: VulnLab[] = [
  { id: '1', name: 'DVWA', category: 'Web', difficulty: 'Easy', port: 8080, description: 'Damn Vulnerable Web App - SQL injection, XSS, CSRF', status: 'stopped' },
  { id: '2', name: 'Juice Shop', category: 'Web', difficulty: 'Medium', port: 3000, description: 'OWASP Juice Shop - Modern web vulnerabilities', status: 'stopped' },
  { id: '3', name: 'WebGoat', category: 'Web', difficulty: 'Easy', port: 8081, description: 'OWASP WebGoat - Guided vulnerability lessons', status: 'stopped' },
  { id: '4', name: 'Mutillidae', category: 'Web', difficulty: 'Easy', port: 8082, description: 'OWASP Mutillidae II - 40+ vulnerabilities', status: 'stopped' },
  { id: '5', name: 'HackTheBox', category: 'CTF', difficulty: 'Hard', port: 1337, description: 'HTB-style challenges locally', status: 'stopped' },
  { id: '6', name: 'VulnHub', category: 'Network', difficulty: 'Medium', port: 4444, description: 'Vulnerable VMs for pentesting', status: 'stopped' },
  { id: '7', name: 'DSVW', category: 'Web', difficulty: 'Easy', port: 1234, description: 'Damn Small Vulnerable Web - minimal vuln app', status: 'stopped' },
  { id: '8', name: 'NodeGoat', category: 'Web', difficulty: 'Medium', port: 4000, description: 'OWASP NodeGoat - Node.js vulnerabilities', status: 'stopped' },
  { id: '9', name: 'RailsGoat', category: 'Web', difficulty: 'Medium', port: 3001, description: 'OWASP RailsGoat - Ruby on Rails vulns', status: 'stopped' },
  { id: '10', name: 'Metasploitable', category: 'Network', difficulty: 'Hard', port: 5555, description: 'Intentionally vulnerable Linux machine', status: 'stopped' },
  { id: '11', name: 'bWAPP', category: 'Web', difficulty: 'Easy', port: 8083, description: 'Buggy Web Application - 100+ vulns', status: 'stopped' },
  { id: '12', name: 'XVWA', category: 'Web', difficulty: 'Medium', port: 8084, description: 'Xtreme Vulnerable Web App', status: 'stopped' },
];

const diffColor = (d: string) => d === 'Easy' ? 'hsl(var(--os-terminal-green))' : d === 'Medium' ? '#ffab40' : '#ff5252';

export default function VulnLabOrbital({ windowId }: { windowId: string }) {
  const [labs, setLabs] = useState(LABS);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(LABS.map(l => l.category)))];

  const toggleLab = (id: string) => {
    setLabs(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (l.status === 'stopped') {
        setTimeout(() => setLabs(p => p.map(x => x.id === id ? { ...x, status: 'running' } : x)), 1500);
        return { ...l, status: 'starting' };
      }
      return { ...l, status: 'stopped' };
    }));
  };

  const filtered = filter === 'All' ? labs : labs.filter(l => l.category === filter);
  const running = labs.filter(l => l.status === 'running').length;

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-terminal-bg))] text-[hsl(var(--foreground))] font-mono-os text-xs overflow-hidden">
      <div className="p-3 border-b border-[hsl(var(--border))] flex items-center gap-2">
        <span className="text-base">🧪</span>
        <span className="font-bold text-sm" style={{ color: '#e040fb' }}>VulnLab Orbital</span>
        <div className="flex-1" />
        <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: running > 0 ? 'hsl(var(--os-terminal-green) / 0.15)' : 'hsl(var(--muted))', color: running > 0 ? 'hsl(var(--os-terminal-green))' : 'hsl(var(--muted-foreground))' }}>
          {running} running
        </span>
      </div>

      <div className="p-2 border-b border-[hsl(var(--border))] flex gap-1.5">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className="px-2 py-1 rounded text-[10px] border transition-all"
            style={{ borderColor: filter === c ? '#e040fb' : 'hsl(var(--border))', background: filter === c ? 'rgba(224,64,251,0.12)' : 'transparent', color: filter === c ? '#e040fb' : 'hsl(var(--muted-foreground))' }}>
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto scrollbar-os p-2">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(lab => (
            <div key={lab.id} onClick={() => setSelected(lab.id)} className="p-3 rounded-lg border cursor-pointer transition-all hover:border-[hsl(var(--primary))]"
              style={{ background: 'hsl(var(--card))', borderColor: selected === lab.id ? '#e040fb' : 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[11px] text-[hsl(var(--foreground))]">{lab.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: diffColor(lab.difficulty), background: 'hsl(var(--muted))' }}>{lab.difficulty}</span>
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">{lab.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[hsl(var(--muted-foreground))]">:{lab.port}</span>
                <button onClick={e => { e.stopPropagation(); toggleLab(lab.id); }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: lab.status === 'running' ? 'hsl(var(--destructive) / 0.15)' : lab.status === 'starting' ? 'hsl(var(--os-terminal-cyan) / 0.15)' : 'hsl(var(--primary) / 0.15)',
                    color: lab.status === 'running' ? 'hsl(var(--destructive))' : lab.status === 'starting' ? 'hsl(var(--os-terminal-cyan))' : 'hsl(var(--primary))',
                  }}>
                  {lab.status === 'running' ? '■ Stop' : lab.status === 'starting' ? '⟳ Starting' : '▶ Start'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
