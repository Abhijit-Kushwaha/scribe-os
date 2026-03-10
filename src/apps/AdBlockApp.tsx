import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, BarChart3, Filter, Zap, Activity, Globe, AlertTriangle } from 'lucide-react';

const FILTER_LISTS = [
  { name: 'EasyList', rules: 72534, active: true, cat: 'Ads' },
  { name: 'EasyPrivacy', rules: 18762, active: true, cat: 'Privacy' },
  { name: 'Malware Domains', rules: 8241, active: true, cat: 'Security' },
  { name: 'Fanboy Annoyances', rules: 45123, active: true, cat: 'Annoyances' },
  { name: "Peter Lowe's List", rules: 3421, active: true, cat: 'Ads' },
  { name: 'uBlock Filters', rules: 31256, active: true, cat: 'Ads' },
  { name: 'URLHaus Malware', rules: 12876, active: true, cat: 'Security' },
  { name: 'Phishing URL Blocklist', rules: 9843, active: true, cat: 'Security' },
];

export default function AdBlockApp() {
  const [enabled, setEnabled] = useState(true);
  const [tab, setTab] = useState<'dashboard'|'filters'|'log'>('dashboard');
  const [stats, setStats] = useState({ blocked: 1247, trackers: 89, scripts: 34, pages: 156, malware: 7, cosmetic: 234 });
  const [recentBlocks, setRecentBlocks] = useState<{domain:string;type:string;time:string}[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const domains = ['ads.doubleclick.net','tracker.facebook.com','analytics.google.com','pixel.quantserve.com','cdn.taboola.com','securepubads.g.doubleclick.net','pagead2.googlesyndication.com','connect.facebook.net','bat.bing.com','static.criteo.net','api.mixpanel.com','cdn.segment.com','sentry.io','hotjar.com','mouseflow.com'];
    const types = ['network','cosmetic','script','xhr','image','frame'];
    const t = setInterval(() => {
      setStats(p => ({
        blocked: p.blocked + Math.floor(Math.random() * 5),
        trackers: p.trackers + (Math.random() > 0.6 ? 1 : 0),
        scripts: p.scripts + (Math.random() > 0.7 ? 1 : 0),
        pages: p.pages,
        malware: p.malware + (Math.random() > 0.95 ? 1 : 0),
        cosmetic: p.cosmetic + Math.floor(Math.random() * 3),
      }));
      if (Math.random() > 0.3) {
        setRecentBlocks(prev => [{
          domain: domains[Math.floor(Math.random()*domains.length)],
          type: types[Math.floor(Math.random()*types.length)],
          time: new Date().toLocaleTimeString(),
        }, ...prev].slice(0, 50));
      }
    }, 1500);
    return () => clearInterval(t);
  }, [enabled]);

  const totalRules = FILTER_LISTS.filter(f=>f.active).reduce((a,f)=>a+f.rules, 0);

  return (
    <div className="h-full flex flex-col text-xs">
      {/* Tabs */}
      <div className="flex border-b border-border/30 bg-secondary/20">
        {(['dashboard','filters','log'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className={`flex-1 py-2 text-center capitalize transition-colors ${tab===t?'text-primary border-b-2 border-primary':'text-muted-foreground hover:text-foreground'}`}
          >{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-os p-4">
        {tab === 'dashboard' && (
          <>
            {/* Master toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${enabled ? 'bg-primary/20 text-primary os-glow' : 'bg-destructive/20 text-destructive'}`}>
                  <Shield size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold">{enabled ? 'Protection Active' : 'Protection Off'}</div>
                  <div className="text-[10px] text-muted-foreground">{totalRules.toLocaleString()} active filter rules</div>
                </div>
              </div>
              <button onClick={() => setEnabled(!enabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`w-5 h-5 rounded-full bg-foreground absolute top-0.5 transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: <Eye size={14} />, label: 'Ads Blocked', value: stats.blocked, color: 'text-primary' },
                { icon: <EyeOff size={14} />, label: 'Trackers', value: stats.trackers, color: 'text-os-terminal-cyan' },
                { icon: <Zap size={14} />, label: 'Scripts', value: stats.scripts, color: 'text-os-terminal-green' },
                { icon: <AlertTriangle size={14} />, label: 'Malware', value: stats.malware, color: 'text-destructive' },
                { icon: <Globe size={14} />, label: 'Cosmetic', value: stats.cosmetic, color: 'text-accent' },
                { icon: <BarChart3 size={14} />, label: 'Pages', value: stats.pages, color: 'text-muted-foreground' },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded-lg bg-secondary/20">
                  <div className={`${s.color} mb-1`}>{s.icon}</div>
                  <div className="text-lg font-bold">{s.value.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Efficiency bar */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Blocking Efficiency</span>
                <span className="font-bold text-primary">99.2%</span>
              </div>
              <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '99.2%' }} />
              </div>
            </div>

            {/* Recent blocks */}
            <div className="text-[10px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Activity size={10} /> Live Blocked Requests
            </div>
            <div className="space-y-0.5 max-h-32 overflow-y-auto scrollbar-os">
              {recentBlocks.slice(0, 10).map((b, i) => (
                <div key={i} className="flex items-center gap-2 py-1 px-2 rounded bg-secondary/10 text-[10px]">
                  <span className="text-destructive">✕</span>
                  <span className="flex-1 truncate font-mono text-muted-foreground">{b.domain}</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted/30 text-[9px]">{b.type}</span>
                </div>
              ))}
              {recentBlocks.length === 0 && <div className="text-center text-muted-foreground py-4">Monitoring...</div>}
            </div>
          </>
        )}

        {tab === 'filters' && (
          <div className="space-y-1">
            <div className="text-muted-foreground mb-2">
              {FILTER_LISTS.filter(f=>f.active).length} of {FILTER_LISTS.length} lists active • {totalRules.toLocaleString()} rules
            </div>
            {FILTER_LISTS.map(fl => (
              <div key={fl.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full ${fl.active ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1">
                  <div className="font-medium">{fl.name}</div>
                  <div className="text-[10px] text-muted-foreground">{fl.cat} • {fl.rules.toLocaleString()} rules</div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${fl.active ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground'}`}>
                  {fl.active ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'log' && (
          <div className="font-mono text-[10px] space-y-0.5">
            {recentBlocks.length === 0 && <div className="text-center text-muted-foreground mt-8">No blocked requests yet</div>}
            {recentBlocks.map((b, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span className="text-muted-foreground/50 w-16 shrink-0">{b.time}</span>
                <span className="text-destructive shrink-0">BLOCK</span>
                <span className="truncate text-muted-foreground">{b.domain}</span>
                <span className="ml-auto px-1 rounded bg-muted/20 text-[9px]">{b.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 bg-secondary/20 border-t border-border/30 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Filter size={9} />
        <span>Scribe uBlock • {totalRules.toLocaleString()} rules loaded • Simulated</span>
      </div>
    </div>
  );
}
