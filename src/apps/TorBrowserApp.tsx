import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, Search, Shield, Lock, Plus, X } from 'lucide-react';

const rIP = () => `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*254+1)}`;

const ONION_SITES: Record<string, { title: string; content: string; favicon: string }> = {
  'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion': {
    title: 'DuckDuckGo',
    content: 'Privacy-respecting search engine. Your searches are never tracked.',
    favicon: '🦆',
  },
  'darkfailenbsdla5mal2mxn2uz66od5vtzd5qozslagrfzachha3f3id.onion': {
    title: 'Dark.fail',
    content: 'Verified .onion link directory. PGP-signed, no JavaScript required.',
    favicon: '🔗',
  },
  'wasabiukrxmkdgve5kynjztuovbg43uxcbcxn6y2okcrsg7gb6jdmbad.onion': {
    title: 'Wasabi Wallet',
    content: 'Open-source Bitcoin wallet with built-in CoinJoin for privacy.',
    favicon: '₿',
  },
  'protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion': {
    title: 'ProtonMail',
    content: 'End-to-end encrypted email. Swiss privacy.',
    favicon: '📧',
  },
};

const BOOKMARKS = [
  { name: 'DuckDuckGo', url: 'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion' },
  { name: 'ProtonMail', url: 'protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion' },
  { name: 'Dark.fail', url: 'darkfailenbsdla5mal2mxn2uz66od5vtzd5qozslagrfzachha3f3id.onion' },
];

interface Tab {
  id: string;
  url: string;
  title: string;
}

export default function TorBrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', url: 'about:tor', title: 'Tor Browser' }]);
  const [activeTab, setActiveTab] = useState('1');
  const [urlInput, setUrlInput] = useState('');
  const [circuit, setCircuit] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Simulate Tor bootstrap
    const timer = setTimeout(() => {
      setCircuit([rIP() + ' (Guard)', rIP() + ' (Middle)', rIP() + ' (Exit)']);
      setConnected(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];
  const currentSite = ONION_SITES[currentTab.url];

  const navigate = (url: string) => {
    setLoading(true);
    setUrlInput(url);
    // Rotate circuit
    setCircuit([rIP() + ' (Guard)', rIP() + ' (Middle)', rIP() + ' (Exit)']);
    setTimeout(() => {
      setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, url, title: ONION_SITES[url]?.title || url.slice(0, 20) + '...' } : t));
      setLoading(false);
    }, Math.random() * 1500 + 800);
  };

  const addTab = () => {
    const id = Date.now().toString();
    setTabs(prev => [...prev, { id, url: 'about:tor', title: 'New Tab' }]);
    setActiveTab(id);
    setUrlInput('');
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered);
    if (activeTab === id) setActiveTab(filtered[0].id);
  };

  return (
    <div className="h-full flex flex-col text-xs" style={{ background: '#1c1b22' }}>
      {/* Tab bar */}
      <div className="flex items-center bg-[#2b2a33] px-1 pt-1 gap-0.5 min-h-[32px]">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setUrlInput(tab.url === 'about:tor' ? '' : tab.url); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg cursor-pointer max-w-[160px] group ${
              activeTab === tab.id ? 'bg-[#42414d] text-[#fbfbfe]' : 'text-[#bfbfc9] hover:bg-[#3a3944]'
            }`}
          >
            <span className="truncate flex-1 text-[11px]">{tab.title}</span>
            <button onClick={e => { e.stopPropagation(); closeTab(tab.id); }} className="opacity-0 group-hover:opacity-100 hover:bg-[#52515e] rounded p-0.5">
              <X size={10} />
            </button>
          </div>
        ))}
        <button onClick={addTab} className="p-1.5 text-[#bfbfc9] hover:bg-[#3a3944] rounded">
          <Plus size={12} />
        </button>
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#2b2a33]">
        <button className="p-1 rounded hover:bg-[#42414d] text-[#bfbfc9]"><ArrowLeft size={14} /></button>
        <button className="p-1 rounded hover:bg-[#42414d] text-[#bfbfc9]"><ArrowRight size={14} /></button>
        <button onClick={() => currentTab.url !== 'about:tor' && navigate(currentTab.url)} className="p-1 rounded hover:bg-[#42414d] text-[#bfbfc9]">
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#42414d] rounded-lg px-3 py-1.5">
          {connected && <Shield size={12} className="text-[#7542e5] shrink-0" />}
          <Lock size={10} className="text-[#bfbfc9] shrink-0" />
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) navigate(urlInput.trim()); }}
            placeholder="Search with DuckDuckGo or enter address"
            className="flex-1 bg-transparent text-xs outline-none text-[#fbfbfe] placeholder-[#8f8f9d]"
          />
        </div>
      </div>

      {/* Bookmarks bar */}
      <div className="flex items-center gap-1 px-3 py-1 bg-[#2b2a33] border-b border-[#42414d]">
        {BOOKMARKS.map(b => (
          <button
            key={b.url}
            onClick={() => navigate(b.url)}
            className="px-2 py-0.5 rounded text-[10px] text-[#bfbfc9] hover:bg-[#42414d] transition-colors"
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" style={{ background: '#1c1b22' }}>
        {!connected ? (
          <div className="flex flex-col items-center justify-center h-full text-[#bfbfc9]">
            <div className="w-12 h-12 border-2 border-[#7542e5] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Connecting to the Tor network...</p>
            <p className="text-[10px] text-[#8f8f9d] mt-1">Establishing encrypted circuit</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#bfbfc9]">
            <div className="w-8 h-8 border-2 border-[#7542e5] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[11px]">Loading through Tor circuit...</p>
          </div>
        ) : currentTab.url === 'about:tor' ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#7542e5]/20 flex items-center justify-center mb-4">
              <Globe size={32} className="text-[#7542e5]" />
            </div>
            <h2 className="text-lg font-semibold text-[#fbfbfe] mb-1">Connected to Tor</h2>
            <p className="text-[11px] text-[#8f8f9d] mb-4 max-w-xs">Your connection is routed through 3 relays. Websites cannot determine your real IP address.</p>
            <div className="bg-[#2b2a33] rounded-lg p-3 text-left text-[10px] w-full max-w-xs">
              <div className="text-[#8f8f9d] mb-2 font-medium">Current Circuit:</div>
              {circuit.map((hop, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                  <span className="text-[#7542e5]">{i === 0 ? '🔒' : i === 1 ? '🔗' : '🌐'}</span>
                  <span className="text-[#bfbfc9] font-mono">{hop}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-xs">
              {BOOKMARKS.map(b => (
                <button
                  key={b.url}
                  onClick={() => navigate(b.url)}
                  className="p-2 bg-[#2b2a33] rounded-lg hover:bg-[#42414d] text-[#bfbfc9] text-[11px] transition-colors"
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        ) : currentSite ? (
          <div className="p-6">
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{currentSite.favicon}</span>
                <h1 className="text-lg font-bold text-[#fbfbfe]">{currentSite.title}</h1>
              </div>
              <div className="bg-[#2b2a33] rounded-lg p-4 mb-4">
                <p className="text-[#bfbfc9] text-sm">{currentSite.content}</p>
              </div>
              <div className="text-[10px] text-[#8f8f9d] bg-[#2b2a33] rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1"><Shield size={10} className="text-[#7542e5]" /> Onion Connection</div>
                <div className="font-mono break-all">{currentTab.url}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#8f8f9d]">
            <Globe size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Page not found</p>
            <p className="text-[10px] mt-1 font-mono break-all max-w-xs text-center">{currentTab.url}</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#2b2a33] border-t border-[#42414d] text-[10px] text-[#8f8f9d]">
        <div className="flex items-center gap-2">
          <Shield size={9} className="text-[#7542e5]" />
          <span>Tor Circuit: 3 hops</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Exit: {circuit[2]?.split(' ')[0] || '...'}</span>
          <span>•</span>
          <span>Simulated</span>
        </div>
      </div>
    </div>
  );
}
