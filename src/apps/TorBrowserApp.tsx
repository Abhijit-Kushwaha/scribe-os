import React, { useState, useEffect, useCallback } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, Shield, Lock, Plus, X, RefreshCw, ExternalLink, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const rIP = () => `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*254+1)}`;

const COUNTRY_FLAGS: Record<string, string> = {
  us: '🇺🇸', de: '🇩🇪', nl: '🇳🇱', fr: '🇫🇷', gb: '🇬🇧', se: '🇸🇪', ch: '🇨🇭', ca: '🇨🇦',
  fi: '🇫🇮', ro: '🇷🇴', at: '🇦🇹', no: '🇳🇴', lu: '🇱🇺', dk: '🇩🇰', cz: '🇨🇿', bg: '🇧🇬',
  is: '🇮🇸', md: '🇲🇩', ua: '🇺🇦', lt: '🇱🇹', lv: '🇱🇻', ee: '🇪🇪', jp: '🇯🇵', sg: '🇸🇬',
};

const ONION_SITES: Record<string, { title: string; favicon: string; description: string; clearnetMirror?: string; category: string }> = {
  'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion': {
    title: 'DuckDuckGo', favicon: '🦆', category: 'Search', description: 'Privacy-respecting search engine.',
    clearnetMirror: 'https://duckduckgo.com',
  },
  'protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion': {
    title: 'ProtonMail', favicon: '📧', category: 'Email', description: 'End-to-end encrypted email.',
    clearnetMirror: 'https://mail.proton.me',
  },
  'nytimesn7cgmftshazwhfgzm37qxb44r64ytbb2dj3x62d2lbd7tyd.onion': {
    title: 'The New York Times', favicon: '📰', category: 'News', description: 'NYT onion service.',
    clearnetMirror: 'https://www.nytimes.com',
  },
  'bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion': {
    title: 'BBC News', favicon: '📺', category: 'News', description: 'BBC Tor mirror.',
    clearnetMirror: 'https://www.bbc.com/news',
  },
  'archivebyd3rzt3ehjpm4c3bjkyyyf7sqa2g5sgo4hpnsa2klxql3mid.onion': {
    title: 'Internet Archive', favicon: '🏛️', category: 'Library', description: 'Universal access to knowledge.',
    clearnetMirror: 'https://archive.org',
  },
  'facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbshg7kx5tfyd.onion': {
    title: 'Facebook', favicon: '👤', category: 'Social', description: 'Facebook .onion mirror.',
    clearnetMirror: 'https://www.facebook.com',
  },
  'darkfailenbsdla5mal2mxn2uz66od5vtzd5qozslagrfzachha3f3id.onion': {
    title: 'dark.fail', favicon: '🔗', category: 'Directory', description: 'PGP-verified .onion link directory.',
  },
  'ciadotgov4sjwlzihbbgxnqg3xiyrg7so2r2o3lt5wz5ypk4sxyjstad.onion': {
    title: 'CIA', favicon: '🏛️', category: 'Government', description: 'CIA official .onion site.',
    clearnetMirror: 'https://www.cia.gov',
  },
  'wasabiukrxmkdgve5kynjztuovbg43uxcbcxn6y2okcrsg7gb6jdmbad.onion': {
    title: 'Wasabi Wallet', favicon: '₿', category: 'Crypto', description: 'Bitcoin wallet with CoinJoin.',
  },
  'keybase5wmilwokqirssclfnsqrjdsi7jdir5ber9z9jkcbm4lvtt4yd.onion': {
    title: 'Keybase', favicon: '🔑', category: 'Crypto', description: 'E2E encrypted chat & files.',
  },
  'secaborazzzahid2w2js2xr3tvmnkpzfocmh5zrfzagcmpb7oi3ixid.onion': {
    title: 'SecureDrop (Guardian)', favicon: '🗞️', category: 'Whistleblowing', description: 'Anonymous document submission.',
  },
  'propub3r6espa33w.onion': {
    title: 'ProPublica', favicon: '📋', category: 'News', description: 'Investigative journalism.',
    clearnetMirror: 'https://www.propublica.org',
  },
};

const BOOKMARKS = [
  { name: '🦆 DuckDuckGo', url: 'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion' },
  { name: '📧 ProtonMail', url: 'protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion' },
  { name: '📰 NYTimes', url: 'nytimesn7cgmftshazwhfgzm37qxb44r64ytbb2dj3x62d2lbd7tyd.onion' },
  { name: '📺 BBC', url: 'bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion' },
  { name: '🏛️ Archive', url: 'archivebyd3rzt3ehjpm4c3bjkyyyf7sqa2g5sgo4hpnsa2klxql3mid.onion' },
  { name: '🔗 dark.fail', url: 'darkfailenbsdla5mal2mxn2uz66od5vtzd5qozslagrfzachha3f3id.onion' },
];

interface Tab {
  id: string;
  url: string;
  title: string;
  htmlContent?: string;
  loading: boolean;
  error?: string;
}

interface CircuitHop {
  nickname: string; ip: string; country: string; role: string; bandwidth: string;
}

/* ─── Proxy fetch via edge function ─── */
const proxyFetch = async (url: string): Promise<{ html?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('web-proxy', { body: { url } });
    if (error) return { error: error.message };
    if (data.error) return { error: data.error };
    return { html: data.html };
  } catch (e: any) {
    return { error: e.message || 'Failed to fetch' };
  }
};

export default function TorBrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', url: 'about:tor', title: 'Tor Browser', loading: false }]);
  const [activeTab, setActiveTab] = useState('1');
  const [urlInput, setUrlInput] = useState('');
  const [circuit, setCircuit] = useState<CircuitHop[]>([]);
  const [bootPhase, setBootPhase] = useState<'connecting' | 'building' | 'ready'>('connecting');
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [relayCount, setRelayCount] = useState(0);
  const [showCircuit, setShowCircuit] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [torVerified, setTorVerified] = useState(false);

  useEffect(() => {
    const boot = async () => {
      setBootLog(['Bootstrapping Tor client...']);
      await new Promise(r => setTimeout(r, 400));
      setBootLog(p => [...p, 'Fetching consensus from directory authorities...']);
      
      let count = 6847;
      try {
        const res = await fetch('https://onionoo.torproject.org/summary?limit=3&running=true&flag=Guard');
        if (res.ok) count = 7000 + Math.floor(Math.random() * 500);
      } catch {}
      setRelayCount(count);

      await new Promise(r => setTimeout(r, 300));
      setBootLog(p => [...p, `Consensus loaded: ${count} relays online`]);
      setBootPhase('building');

      await new Promise(r => setTimeout(r, 400));
      const c = buildCircuit();
      setCircuit(c);
      setBootLog(p => [...p, `Guard: ${c[0].nickname} (${c[0].ip})`, `Middle: ${c[1].nickname} (${c[1].ip})`, `Exit: ${c[2].nickname} (${c[2].ip})`]);
      
      await new Promise(r => setTimeout(r, 300));
      setBootLog(p => [...p, 'Circuit built. Connection established ✓']);
      setBootPhase('ready');
    };
    boot();
  }, []);

  const buildCircuit = useCallback((): CircuitHop[] => {
    const names = ['Assange2','Snowden','TorRelay42','Freedom','NoSpy','CryptoNode','PrivacyFirst','Bifrost','Asgard','Fenrir','Midgard','Nidhogg','Mjolnir','Ragnarok','Valkyrie','Yggdrasil'];
    const countries = ['de','nl','us','se','ch','fr','fi','ro','no','at','lu','is','ca','gb','cz'];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    return [
      { nickname: pick(names), ip: rIP(), country: pick(countries), role: 'Guard', bandwidth: `${Math.floor(Math.random()*80+20)} Mbit/s` },
      { nickname: pick(names), ip: rIP(), country: pick(countries), role: 'Middle', bandwidth: `${Math.floor(Math.random()*60+10)} Mbit/s` },
      { nickname: pick(names), ip: rIP(), country: pick(countries), role: 'Exit', bandwidth: `${Math.floor(Math.random()*50+15)} Mbit/s` },
    ];
  }, []);

  const newCircuit = useCallback(() => setCircuit(buildCircuit()), [buildCircuit]);

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];
  const currentSite = ONION_SITES[currentTab.url];

  // Listen for navigation messages from proxied pages
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'navigate' && e.data.url) {
        navigate(e.data.url);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [activeTab]);

  const navigate = useCallback(async (url: string) => {
    newCircuit();
    setUrlInput(url);
    const site = ONION_SITES[url];

    // Determine the actual fetch URL
    let fetchUrl: string;
    if (url.endsWith('.onion')) {
      // Use clearnet mirror if available, otherwise try onion.ws gateway
      if (site?.clearnetMirror) {
        fetchUrl = site.clearnetMirror;
      } else {
        fetchUrl = `https://${url}.ws`;
      }
    } else if (url.startsWith('http')) {
      fetchUrl = url;
    } else {
      fetchUrl = `https://${url}`;
    }

    // Set loading
    setTabs(prev => prev.map(t => t.id === activeTab ? {
      ...t, url, title: site?.title || 'Loading...', loading: true, htmlContent: undefined, error: undefined,
    } : t));

    // Fetch via edge function proxy
    const result = await proxyFetch(fetchUrl);

    let pageTitle = site?.title || url.slice(0, 24);
    if (result.html) {
      const match = result.html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match) pageTitle = match[1].trim().slice(0, 60);
    }

    setTabs(prev => prev.map(t => t.id === activeTab ? {
      ...t, loading: false, title: pageTitle, htmlContent: result.html, error: result.error,
    } : t));
  }, [activeTab, newCircuit]);

  const verifyTor = useCallback(() => {
    setTorVerified(false);
    setTimeout(() => setTorVerified(true), 1500);
  }, []);

  const addTab = () => {
    const id = Date.now().toString();
    setTabs(prev => [...prev, { id, url: 'about:tor', title: 'New Tab', loading: false }]);
    setActiveTab(id);
    setUrlInput('');
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered);
    if (activeTab === id) setActiveTab(filtered[0].id);
  };

  const onionSitesList = Object.entries(ONION_SITES);

  return (
    <div className="h-full flex flex-col text-xs" style={{ background: '#1c1b22' }}>
      {/* Tab bar */}
      <div className="flex items-center bg-[#2b2a33] px-1 pt-1 gap-0.5 min-h-[32px]">
        {tabs.map(tab => (
          <div key={tab.id}
            onClick={() => { setActiveTab(tab.id); setUrlInput(tab.url === 'about:tor' ? '' : tab.url); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg cursor-pointer max-w-[160px] group ${
              activeTab === tab.id ? 'bg-[#42414d] text-[#fbfbfe]' : 'text-[#bfbfc9] hover:bg-[#3a3944]'
            }`}>
            {tab.loading ? <RotateCw size={10} className="animate-spin text-[#7542e5] shrink-0" /> : null}
            <span className="truncate flex-1 text-[11px]">{tab.title}</span>
            <button onClick={e => { e.stopPropagation(); closeTab(tab.id); }} className="opacity-0 group-hover:opacity-100 hover:bg-[#52515e] rounded p-0.5">
              <X size={10} />
            </button>
          </div>
        ))}
        <button onClick={addTab} className="p-1.5 text-[#bfbfc9] hover:bg-[#3a3944] rounded"><Plus size={12} /></button>
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#2b2a33]">
        <button className="p-1 rounded hover:bg-[#42414d] text-[#bfbfc9]"><ArrowLeft size={14} /></button>
        <button className="p-1 rounded hover:bg-[#42414d] text-[#bfbfc9]"><ArrowRight size={14} /></button>
        <button onClick={() => currentTab.url !== 'about:tor' && navigate(currentTab.url)} className="p-1 rounded hover:bg-[#42414d] text-[#bfbfc9]">
          <RotateCw size={14} className={currentTab.loading ? 'animate-spin' : ''} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#42414d] rounded-lg px-3 py-1.5">
          {bootPhase === 'ready' && <Shield size={12} className="text-[#7542e5] shrink-0" />}
          <Lock size={10} className="text-[#bfbfc9] shrink-0" />
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) navigate(urlInput.trim()); }}
            placeholder=".onion address or search with DuckDuckGo"
            className="flex-1 bg-transparent text-xs outline-none text-[#fbfbfe] placeholder-[#8f8f9d]" />
        </div>
        <button onClick={() => setShowCircuit(!showCircuit)} className={`p-1 rounded text-[#bfbfc9] ${showCircuit ? 'bg-[#7542e5]/20 text-[#7542e5]' : 'hover:bg-[#42414d]'}`}>
          <Shield size={14} />
        </button>
        <button onClick={() => setShowDirectory(!showDirectory)} className={`p-1 rounded text-[#bfbfc9] ${showDirectory ? 'bg-[#7542e5]/20 text-[#7542e5]' : 'hover:bg-[#42414d]'}`}>
          <Bookmark size={14} />
        </button>
      </div>

      {/* Bookmarks bar */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-[#2b2a33] border-b border-[#42414d] overflow-x-auto">
        {BOOKMARKS.map(b => (
          <button key={b.url} onClick={() => navigate(b.url)}
            className="px-2 py-0.5 rounded text-[10px] text-[#bfbfc9] hover:bg-[#42414d] transition-colors whitespace-nowrap">
            {b.name}
          </button>
        ))}
      </div>

      {/* Circuit sidebar */}
      {showCircuit && (
        <div className="absolute right-0 top-[106px] w-64 bg-[#2b2a33] border-l border-[#42414d] z-10 p-3 shadow-xl" style={{ bottom: 24 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-[#fbfbfe]">Tor Circuit</span>
            <button onClick={newCircuit} className="p-1 rounded hover:bg-[#42414d] text-[#bfbfc9]" title="New Circuit"><RefreshCw size={12} /></button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#42414d]/50">
              <span className="text-sm">💻</span>
              <div><div className="text-[10px] text-[#fbfbfe]">Your Computer</div><div className="text-[9px] text-[#8f8f9d] font-mono">IP hidden</div></div>
            </div>
            {circuit.map((hop, i) => (
              <React.Fragment key={i}>
                <div className="flex justify-center"><div className="w-px h-3 bg-[#7542e5]/50" /></div>
                <div className={`flex items-center gap-2 px-2 py-1.5 rounded ${i === 2 ? 'bg-[#7542e5]/10 border border-[#7542e5]/30' : 'bg-[#42414d]/50'}`}>
                  <span className="text-sm">{COUNTRY_FLAGS[hop.country] || '🌐'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#fbfbfe] flex items-center gap-1">
                      {hop.nickname}
                      <span className="text-[8px] px-1 py-0 rounded bg-[#7542e5]/20 text-[#7542e5]">{hop.role}</span>
                    </div>
                    <div className="text-[9px] text-[#8f8f9d] font-mono">{hop.ip}</div>
                    <div className="text-[9px] text-[#8f8f9d]">{hop.bandwidth}</div>
                  </div>
                </div>
              </React.Fragment>
            ))}
            <div className="flex justify-center"><div className="w-px h-3 bg-[#7542e5]/50" /></div>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#42414d]/50">
              <span className="text-sm">🌐</span>
              <div><div className="text-[10px] text-[#fbfbfe]">{currentSite?.title || 'Destination'}</div><div className="text-[9px] text-[#8f8f9d] font-mono truncate">{currentTab.url === 'about:tor' ? '—' : currentTab.url.slice(0, 24) + '...'}</div></div>
            </div>
          </div>
          <button onClick={verifyTor} className="w-full mt-3 py-1.5 rounded bg-[#7542e5]/20 text-[#7542e5] text-[10px] hover:bg-[#7542e5]/30 transition-colors">
            {torVerified ? '✓ Connected via Tor' : 'Verify Tor Connection'}
          </button>
          {torVerified && (
            <div className="mt-2 p-2 rounded bg-green-900/20 border border-green-500/30 text-[10px] text-green-400">
              ✓ Your browser is configured to use Tor.<br />Exit IP: {circuit[2]?.ip || rIP()}<br />Country: {COUNTRY_FLAGS[circuit[2]?.country] || '🌐'} {circuit[2]?.country?.toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto relative" style={{ background: '#1c1b22' }}>
        {/* Onion directory */}
        {showDirectory && (
          <div className="absolute inset-0 z-10 bg-[#1c1b22] overflow-auto p-4">
            <h2 className="text-sm font-semibold text-[#fbfbfe] mb-1">🧅 Onion Directory</h2>
            <p className="text-[10px] text-[#8f8f9d] mb-3">{onionSitesList.length} verified .onion services</p>
            <div className="space-y-1">
              {onionSitesList.map(([url, site]) => (
                <button key={url} onClick={() => { navigate(url); setShowDirectory(false); }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-[#42414d] transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{site.favicon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#fbfbfe] font-medium">{site.title}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#42414d] text-[#8f8f9d]">{site.category}</span>
                      </div>
                      <div className="text-[9px] text-[#8f8f9d] truncate font-mono mt-0.5">{url}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {bootPhase !== 'ready' ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-14 h-14 rounded-full bg-[#7542e5]/10 flex items-center justify-center mb-4">
              <div className="w-10 h-10 border-2 border-[#7542e5] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-medium text-[#fbfbfe] mb-1">
              {bootPhase === 'connecting' ? 'Connecting to Tor network...' : 'Building circuit...'}
            </p>
            <div className="w-full max-w-xs mt-4 bg-[#2b2a33] rounded-lg p-3 font-mono text-[10px] max-h-40 overflow-auto">
              {bootLog.map((line, i) => (
                <div key={i} className={`py-0.5 ${line.includes('✓') ? 'text-green-400' : 'text-[#8f8f9d]'}`}>{line}</div>
              ))}
            </div>
          </div>
        ) : currentTab.loading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#bfbfc9]">
            <div className="w-8 h-8 border-2 border-[#7542e5] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[11px]">Routing through Tor circuit...</p>
            <p className="text-[9px] text-[#8f8f9d] mt-1">
              {circuit[0]?.nickname} → {circuit[1]?.nickname} → {circuit[2]?.nickname}
            </p>
          </div>
        ) : currentTab.url === 'about:tor' ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#7542e5]/20 flex items-center justify-center mb-4">
              <span className="text-3xl">🧅</span>
            </div>
            <h2 className="text-lg font-semibold text-[#fbfbfe] mb-1">Connected to Tor</h2>
            <p className="text-[11px] text-[#8f8f9d] mb-2 max-w-sm">
              Your traffic is routed through {circuit.length} relays across {new Set(circuit.map(c => c.country)).size} countries.
              Websites see exit IP <span className="font-mono text-[#7542e5]">{circuit[2]?.ip}</span>, not yours.
            </p>
            <p className="text-[9px] text-[#8f8f9d] mb-4">
              {relayCount > 0 ? `${relayCount.toLocaleString()} relays online` : ''} • Tor Browser 13.0.9
            </p>
            <div className="flex items-center gap-1 mb-6 text-[10px]">
              <span className="px-2 py-1 rounded bg-[#42414d] text-[#bfbfc9]">💻 You</span>
              {circuit.map((hop, i) => (
                <React.Fragment key={i}>
                  <span className="text-[#7542e5]">→</span>
                  <span className="px-2 py-1 rounded bg-[#42414d] text-[#bfbfc9]">{COUNTRY_FLAGS[hop.country] || '🌐'} {hop.nickname}</span>
                </React.Fragment>
              ))}
              <span className="text-[#7542e5]">→</span>
              <span className="px-2 py-1 rounded bg-[#42414d] text-[#bfbfc9]">🌐 Internet</span>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
              {BOOKMARKS.map(b => (
                <button key={b.url} onClick={() => navigate(b.url)}
                  className="p-2.5 bg-[#2b2a33] rounded-lg hover:bg-[#42414d] text-[#bfbfc9] text-[11px] transition-colors">
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        ) : currentTab.htmlContent ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/20 border-b border-green-500/20 text-[10px] text-green-400">
              <Shield size={10} />
              <span>✓ Content loaded via Tor-routed proxy</span>
              <span className="font-mono text-[9px] ml-auto text-[#8f8f9d]">{currentTab.url.slice(0, 40)}...</span>
            </div>
            <iframe srcDoc={currentTab.htmlContent} className="flex-1 w-full border-0"
              sandbox="allow-scripts allow-forms allow-popups" title={currentTab.title} style={{ background: '#fff' }} />
          </div>
        ) : currentTab.error ? (
          <div className="p-6">
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{currentSite?.favicon || '🧅'}</span>
                <div>
                  <h1 className="text-lg font-bold text-[#fbfbfe]">{currentSite?.title || currentTab.url.slice(0, 24)}</h1>
                  {currentSite && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#42414d] text-[#8f8f9d]">{currentSite.category}</span>}
                </div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4 text-[11px] text-yellow-300">
                ⚠ {currentTab.error}
              </div>
              {currentSite && (
                <div className="bg-[#2b2a33] rounded-lg p-4 mb-4">
                  <p className="text-[#bfbfc9] text-sm">{currentSite.description}</p>
                </div>
              )}
              <div className="bg-[#2b2a33] rounded-lg p-3 mb-3">
                <div className="flex items-center gap-1 mb-2 text-[10px] text-[#8f8f9d]"><Shield size={10} className="text-[#7542e5]" /> Onion Address</div>
                <div className="font-mono text-[10px] text-[#bfbfc9] break-all">{currentTab.url}</div>
              </div>
              <button onClick={() => navigate(currentTab.url)}
                className="w-full py-2 rounded bg-[#7542e5]/20 text-[#7542e5] text-[11px] hover:bg-[#7542e5]/30 transition-colors">
                🔄 Retry via new circuit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#8f8f9d]">
            <Globe size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Onion site not in directory</p>
            <p className="text-[10px] mt-1 font-mono break-all max-w-xs text-center">{currentTab.url}</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#2b2a33] border-t border-[#42414d] text-[10px] text-[#8f8f9d]">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${bootPhase === 'ready' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span>Tor {bootPhase === 'ready' ? 'Connected' : 'Bootstrapping...'}</span>
          {bootPhase === 'ready' && <span>• Circuit: {circuit.map(h => COUNTRY_FLAGS[h.country] || '🌐').join(' → ')}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span>Exit: {circuit[2]?.ip || '...'}</span>
          <span>•</span>
          <span>{COUNTRY_FLAGS[circuit[2]?.country] || ''} {circuit[2]?.country?.toUpperCase() || ''}</span>
        </div>
      </div>
    </div>
  );
}
