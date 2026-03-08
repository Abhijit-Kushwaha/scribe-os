import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, BarChart3, Filter, Zap } from 'lucide-react';

export default function AdBlockApp() {
  const [enabled, setEnabled] = useState(true);
  const [stats, setStats] = useState({ blocked: 1247, trackers: 89, scripts: 34, pages: 156 });

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      setStats(p => ({
        blocked: p.blocked + Math.floor(Math.random() * 3),
        trackers: p.trackers + (Math.random() > 0.7 ? 1 : 0),
        scripts: p.scripts + (Math.random() > 0.8 ? 1 : 0),
        pages: p.pages,
      }));
    }, 2000);
    return () => clearInterval(t);
  }, [enabled]);

  const filterLists = [
    { name: 'EasyList', rules: 72534, active: true },
    { name: 'EasyPrivacy', rules: 18762, active: true },
    { name: 'Malware Domains', rules: 8241, active: true },
    { name: 'Fanboy Annoyances', rules: 45123, active: false },
    { name: 'Peter Lowe\'s Ad List', rules: 3421, active: true },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-os p-4">
      {/* Power toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enabled ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
            <Shield size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold">{enabled ? 'Protection Active' : 'Protection Off'}</div>
            <div className="text-[10px] text-muted-foreground">Scribe uBlock</div>
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-primary' : 'bg-muted'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-foreground absolute top-0.5 transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Ads Blocked', value: stats.blocked.toLocaleString(), icon: <Eye size={12} />, color: 'text-primary' },
          { label: 'Trackers', value: stats.trackers.toString(), icon: <EyeOff size={12} />, color: 'text-accent' },
          { label: 'Scripts', value: stats.scripts.toString(), icon: <Zap size={12} />, color: 'text-os-terminal-green' },
          { label: 'Pages', value: stats.pages.toString(), icon: <BarChart3 size={12} />, color: 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-lg bg-secondary/20">
            <div className={`${s.color} mb-1`}>{s.icon}</div>
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter lists */}
      <div className="text-xs font-medium mb-2 flex items-center gap-2">
        <Filter size={12} /> Filter Lists
      </div>
      <div className="space-y-1">
        {filterLists.map(fl => (
          <div key={fl.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
            <div className={`w-2 h-2 rounded-full ${fl.active ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            <span className="flex-1 text-xs">{fl.name}</span>
            <span className="text-[10px] text-muted-foreground">{fl.rules.toLocaleString()} rules</span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2 rounded-lg bg-muted/20 text-[10px] text-muted-foreground text-center">
        Simulated ad blocking — UI demonstration only
      </div>
    </div>
  );
}
