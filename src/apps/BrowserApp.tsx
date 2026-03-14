import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, Search, X, Plus, ChevronDown, Star, Download, Clock, MoveVertical as MoreVertical, Shield, Lock, Layers, FolderDown, ExternalLink, Pause, Play, Trash2, FileText, Zap, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { browserService } from '@/services/browserService';

/* ─── Types ─── */
interface Tab {
  id: string;
  title: string;
  url: string;
  favicon: string;
  groupId?: string;
  loading: boolean;
  htmlContent?: string;
  history: string[];
  historyIdx: number;
  error?: string;
}

interface TabGroup { id: string; name: string; color: string; collapsed: boolean; }
interface HistoryEntry { url: string; title: string; time: number; }
interface DownloadItem { id: string; name: string; url: string; size: string; progress: number; status: 'downloading' | 'paused' | 'complete' | 'failed'; startedAt: number; }

/* ─── Constants ─── */
const GROUP_COLORS = [
  { name: 'Orange', bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', dot: 'bg-orange-500' },
  { name: 'Red', bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', dot: 'bg-red-500' },
  { name: 'Blue', bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', dot: 'bg-blue-500' },
  { name: 'Green', bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', dot: 'bg-green-500' },
  { name: 'Purple', bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', dot: 'bg-purple-500' },
  { name: 'Cyan', bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400', dot: 'bg-cyan-500' },
];

const BOOKMARKS = [
  { name: 'Wikipedia', url: 'https://en.wikipedia.org', icon: '📖' },
  { name: 'Brave Search', url: 'https://search.brave.com', icon: '🦁' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆' },
  { name: 'Archive.org', url: 'https://archive.org', icon: '📚' },
  { name: 'MDN Docs', url: 'https://developer.mozilla.org', icon: '📘' },
  { name: 'W3Schools', url: 'https://w3schools.com', icon: '🎓' },
  { name: 'Example.com', url: 'https://example.com', icon: '🌐' },
  { name: 'httpbin', url: 'https://httpbin.org', icon: '🔧' },
];

const SUGGESTED_SITES = [
  { name: 'Wikipedia', url: 'https://en.wikipedia.org', icon: '📖' },
  { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'Reddit', url: 'https://www.reddit.com', icon: '🟠' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '📚' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆' },
  { name: 'Archive.org', url: 'https://archive.org', icon: '📚' },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const newTab = (url = ''): Tab => ({
  id: uid(), title: url ? (() => { try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname; } catch { return url; } })() : 'New Tab',
  url, favicon: '🌐', loading: false, history: url ? [url] : [], historyIdx: url ? 0 : -1,
});

const faviconFor = (url: string) => {
  if (url.includes('brave.com')) return '🦁'; if (url.includes('google.com')) return '🔍';
  if (url.includes('youtube.com')) return '▶️'; if (url.includes('gmail.com')) return '📧';
  if (url.includes('github.com')) return '🐙'; if (url.includes('reddit.com')) return '🟠';
  if (url.includes('stackoverflow')) return '📚'; if (url.includes('twitter.com') || url.includes('x.com')) return '🐦';
  if (url.includes('duckduckgo.com')) return '🦆'; if (url.includes('wikipedia.org')) return '📖';
  if (url.includes('w3schools.com')) return '🎓'; if (url.includes('amazon.com')) return '📦';
  return '🌐';
};

/* ─── Proxy Fetch ─── */
const proxyFetch = async (url: string): Promise<{ html?: string; error?: string; finalUrl?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('web-proxy', { body: { url } });
    if (error) return { error: error.message };
    if (data.error) return { error: data.error };
    return { html: data.html, finalUrl: data.finalUrl };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { error: e.message };
    }
    return { error: 'Failed to fetch' };
  }
};

/* ─── Shield Stats ─── */
const useShieldStats = () => {
  const [stats, setStats] = useState({ adsBlocked: 14823, trackersBlocked: 8291, httpsUpgrades: 3847, bandwidthSaved: 412, timeSaved: 8.2 });
  useEffect(() => {
    const t = setInterval(() => {
      setStats(s => ({
        adsBlocked: s.adsBlocked + Math.floor(Math.random() * 3),
        trackersBlocked: s.trackersBlocked + Math.floor(Math.random() * 2),
        httpsUpgrades: s.httpsUpgrades + (Math.random() > 0.7 ? 1 : 0),
        bandwidthSaved: +(s.bandwidthSaved + Math.random() * 0.5).toFixed(0),
        timeSaved: +(s.timeSaved + Math.random() * 0.01).toFixed(1),
      }));
    }, 5000);
    return () => clearInterval(t);
  }, []);
  return stats;
};

/* ─── Component ─── */
export default function BrowserApp({ windowId }: { windowId: string }) {
  const [tabs, setTabs] = useState<Tab[]>([newTab()]);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [showTabSearch, setShowTabSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShields, setShowShields] = useState(false);
  const [shieldsUp, setShieldsUp] = useState(true);
  const [tabSearch, setTabSearch] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<Array<{ name: string; url: string; icon: string; id?: string }>>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    { id: '1', name: 'brave-browser-1.73.97-linux-amd64.deb', url: 'https://brave.com', size: '128.4 MB', progress: 67, status: 'downloading', startedAt: Date.now() - 120000 },
    { id: '2', name: 'node-v22.0.0.pkg', url: 'https://nodejs.org', size: '42.1 MB', progress: 100, status: 'complete', startedAt: Date.now() - 300000 },
  ]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const stats = useShieldStats();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const loadHistoryAndBookmarks = async () => {
      const dbHistory = await browserService.getHistory();
      if (dbHistory.length > 0) {
        setHistory(dbHistory.map(h => ({ url: h.url, title: h.title, time: h.visitedAt || 0 })));
      }
      const dbBookmarks = await browserService.getBookmarks();
      setBookmarks(dbBookmarks.map(b => ({ ...b, icon: b.icon || '🌐' })));
    };
    loadHistoryAndBookmarks();
  }, []);

  const current = tabs.find(t => t.id === activeTab) || tabs[0];

  useEffect(() => {
    setUrlInput(current?.url || '');
  }, [activeTab, current?.url]);

  const createGroup = (tabId: string) => {
    const colorIdx = groups.length % GROUP_COLORS.length;
    const g: TabGroup = { id: uid(), name: `Group ${groups.length + 1}`, color: GROUP_COLORS[colorIdx].name, collapsed: false };
    setGroups(prev => [...prev, g]);
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, groupId: g.id } : t));
  };
  const addToGroup = (tabId: string, groupId: string) => setTabs(prev => prev.map(t => t.id === tabId ? { ...t, groupId } : t));
  const removeFromGroup = (tabId: string) => setTabs(prev => prev.map(t => t.id === tabId ? { ...t, groupId: undefined } : t));
  const toggleGroupCollapse = (groupId: string) => setGroups(prev => prev.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
  const getGroupColor = (colorName: string) => GROUP_COLORS.find(c => c.name === colorName) || GROUP_COLORS[0];

  const navigate = useCallback(async (url: string, tabId?: string) => {
    let finalUrl = url.trim();
    if (!finalUrl) return;

    if (!finalUrl.includes('.') && !finalUrl.startsWith('http')) {
      finalUrl = `https://search.brave.com/search?q=${encodeURIComponent(finalUrl)}`;
    } else if (!finalUrl.startsWith('http')) {
      finalUrl = 'https://' + finalUrl;
    }

    const tId = tabId || activeTab;
    const favicon = faviconFor(finalUrl);
    let title = 'Loading...';
    try { title = new URL(finalUrl).hostname.replace('www.', ''); } catch { /* ignore invalid URL */ }

    // Set loading state
    setTabs(prev => prev.map(t => {
      if (t.id !== tId) return t;
      const newHistory = [...t.history.slice(0, t.historyIdx + 1), finalUrl];
      return { ...t, url: finalUrl, title, favicon, loading: true, htmlContent: undefined, error: undefined, history: newHistory, historyIdx: newHistory.length - 1 };
    }));
    setUrlInput(finalUrl);
    setHistory(prev => [{ url: finalUrl, title, time: Date.now() }, ...prev].slice(0, 200));

    // Fetch via proxy
    const result = await proxyFetch(finalUrl);

    // Extract title from HTML
    let pageTitle = title;
    if (result.html) {
      const match = result.html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match) pageTitle = match[1].trim().slice(0, 60);
    }

    setTabs(prev => prev.map(t => t.id === tId ? {
      ...t, loading: false, title: pageTitle, htmlContent: result.html, error: result.error,
    } : t));

    await browserService.addToHistory({ url: finalUrl, title: pageTitle });
  }, [activeTab]);

  // Listen for navigation messages from proxy-loaded pages
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'navigate' && e.data.url) {
        navigate(e.data.url);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler)
  }, [navigate]);

  const goBack = useCallback(() => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab || tab.historyIdx <= 0) return;
    const url = tab.history[tab.historyIdx - 1];
    navigate(url);
  }, [tabs, activeTab, navigate]);

  const goForward = useCallback(() => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab || tab.historyIdx >= tab.history.length - 1) return;
    const url = tab.history[tab.historyIdx + 1];
    navigate(url);
  }, [tabs, activeTab, navigate]);

  const addTab = () => { const t = newTab(); setTabs(prev => [...prev, t]); setActiveTab(t.id); };
  const closeTab = (id: string) => {
    if (tabs.length === 1) { addTab(); }
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTab === id && next.length > 0) setActiveTab(next[next.length - 1].id);
      return next.length > 0 ? next : [newTab()];
    });
  };

  const addBookmark = async () => {
    if (!current?.url) return;
    const newBookmark = await browserService.addBookmark({
      name: current.title || 'Bookmark',
      url: current.url,
      icon: current.favicon,
    });
    if (newBookmark) {
      setBookmarks(prev => [...prev, { ...newBookmark, name: newBookmark.name, url: newBookmark.url, icon: newBookmark.icon || '🌐' }]);
    }
  };

  const removeBookmark = async (id: string | undefined) => {
    if (!id) return;
    await browserService.deleteBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const filteredTabs = tabSearch ? tabs.filter(t => t.title.toLowerCase().includes(tabSearch.toLowerCase()) || t.url.toLowerCase().includes(tabSearch.toLowerCase())) : tabs;

  const renderTabs = () => {
    const ungrouped = tabs.filter(t => !t.groupId);
    const groupedMap = new Map<string, Tab[]>();
    tabs.filter(t => t.groupId).forEach(t => {
      const arr = groupedMap.get(t.groupId!) || [];
      arr.push(t);
      groupedMap.set(t.groupId!, arr);
    });
    const elements: React.ReactNode[] = [];
    groups.forEach(group => {
      const groupTabs = groupedMap.get(group.id) || [];
      if (groupTabs.length === 0) return;
      const gc = getGroupColor(group.color);
      elements.push(
        <button key={`group-${group.id}`} onClick={() => toggleGroupCollapse(group.id)}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-t ${gc.bg} ${gc.text} border-b-2 ${gc.border} shrink-0`}>
          <span className={`w-2 h-2 rounded-full ${gc.dot}`} />
          <span>{group.name}</span>
          <span className="opacity-60">{groupTabs.length}</span>
          <ChevronDown size={10} className={`transition-transform ${group.collapsed ? '-rotate-90' : ''}`} />
        </button>
      );
      if (!group.collapsed) groupTabs.forEach(tab => elements.push(renderTabButton(tab, gc)));
    });
    ungrouped.forEach(tab => elements.push(renderTabButton(tab)));
    return elements;
  };

  const renderTabButton = (tab: Tab, gc?: typeof GROUP_COLORS[0]) => (
    <div key={tab.id}
      className={`group flex items-center gap-1.5 px-3 py-1.5 min-w-[120px] max-w-[200px] rounded-t-lg cursor-pointer transition-all shrink-0 ${
        tab.id === activeTab
          ? `bg-[hsl(var(--os-window-body))] text-foreground ${gc ? `border-t-2 ${gc.border}` : 'border-t-2 border-orange-500'}`
          : 'bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
      }`}
      onClick={() => setActiveTab(tab.id)}
      onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }); }}>
      {tab.loading ? <RotateCw size={11} className="animate-spin text-orange-400 shrink-0" /> : <span className="text-[11px] shrink-0">{tab.favicon}</span>}
      <span className="text-[11px] truncate flex-1">{tab.title || 'New Tab'}</span>
      <button onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted/50 transition-opacity shrink-0"><X size={10} /></button>
    </div>
  );

  const isNewTab = !current?.url;

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]" onClick={() => { setContextMenu(null); setShowMenu(false); setShowShields(false); }}>
      {/* Tab Bar */}
      <div className="flex items-center bg-secondary/30 border-b border-border/20">
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-os gap-0.5 px-1 pt-1">
          {renderTabs()}
        </div>
        <div className="flex items-center gap-0.5 px-2 shrink-0">
          <button onClick={addTab} className="p-1 rounded hover:bg-muted/50 text-muted-foreground" title="New tab"><Plus size={13} /></button>
          <button onClick={e => { e.stopPropagation(); setShowTabSearch(!showTabSearch); }}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground" title="Search tabs"><Layers size={13} /></button>
        </div>
      </div>

      {/* Tab Search */}
      {showTabSearch && (
        <div className="absolute top-10 right-4 w-72 bg-popover border border-border rounded-lg shadow-2xl z-50 p-2" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded mb-2">
            <Search size={12} className="text-muted-foreground" />
            <input value={tabSearch} onChange={e => setTabSearch(e.target.value)} placeholder="Search tabs..." className="flex-1 bg-transparent text-xs outline-none text-foreground" autoFocus />
          </div>
          <div className="text-[10px] text-muted-foreground px-2 mb-1">{tabs.length} tabs open</div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredTabs.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setShowTabSearch(false); setTabSearch(''); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-muted/50 ${t.id === activeTab ? 'bg-muted/30' : ''}`}>
                <span className="text-xs">{t.favicon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-foreground truncate">{t.title || 'New Tab'}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{t.url || 'brave://newtab'}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); closeTab(t.id); }} className="p-0.5 hover:bg-muted rounded"><X size={10} className="text-muted-foreground" /></button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nav Bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-secondary/10">
        <button onClick={goBack} className="p-1 rounded hover:bg-muted/40 text-muted-foreground disabled:opacity-30" disabled={!current || current.historyIdx <= 0}><ArrowLeft size={14} /></button>
        <button onClick={goForward} className="p-1 rounded hover:bg-muted/40 text-muted-foreground disabled:opacity-30" disabled={!current || current.historyIdx >= current.history.length - 1}><ArrowRight size={14} /></button>
        <button onClick={() => current?.url && navigate(current.url)} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><RotateCw size={14} className={current?.loading ? 'animate-spin' : ''} /></button>

        {/* Omnibox */}
        <div className="flex-1 flex items-center gap-2 bg-muted/30 hover:bg-muted/40 rounded-full px-3 py-1.5 transition-colors group focus-within:ring-1 focus-within:ring-orange-500/50">
          {current?.url ? <Lock size={11} className="text-green-500 shrink-0" /> : <Search size={11} className="text-muted-foreground shrink-0" />}
          <input ref={urlRef} value={urlInput} onChange={e => setUrlInput(e.target.value)} 
            onKeyDown={e => { if (e.key === 'Enter') navigate(urlInput); }}
            onFocus={e => e.target.select()}
            placeholder="Search Brave or type a URL"
            className="flex-1 bg-transparent text-[12px] outline-none text-foreground placeholder:text-muted-foreground" />
          <button onClick={addBookmark} disabled={!current?.url} className="p-0.5 hover:bg-muted/50 rounded text-muted-foreground disabled:opacity-30 transition-opacity"><Star size={12} /></button>
        </div>

        <button onClick={e => { e.stopPropagation(); setShowShields(!showShields); setShowDownloads(false); setShowHistory(false); setShowMenu(false); }}
          className={`p-1 rounded hover:bg-muted/40 transition-colors ${shieldsUp ? 'text-orange-400' : 'text-muted-foreground'}`} title="Brave Shields">
          <ShieldCheck size={14} />
        </button>
        <button onClick={e => { e.stopPropagation(); setShowDownloads(!showDownloads); setShowHistory(false); setShowShields(false); setShowMenu(false); }}
          className="p-1 rounded hover:bg-muted/40 text-muted-foreground relative">
          <Download size={14} />
          {downloads.some(d => d.status === 'downloading') && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full" />}
        </button>
        <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); setShowDownloads(false); setShowHistory(false); setShowShields(false); }}
          className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><MoreVertical size={14} /></button>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-0.5 px-3 py-1 bg-secondary/5 border-b border-border/10 overflow-x-auto scrollbar-os">
        {bookmarks.length > 0 ? bookmarks.map(bm => (
          <div key={bm.id || bm.url} className="group relative shrink-0"> 
            <button onClick={() => navigate(bm.url)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:bg-muted/40 whitespace-nowrap transition-colors">
              <span className="text-[10px]">{bm.icon}</span><span>{bm.name}</span>
            </button>
            <button onClick={() => removeBookmark(bm.id)}
              className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-destructive/20 hover:bg-destructive/40 transition-all"> 
              <X size={10} className="text-destructive" />
            </button>
          </div>
        )) : BOOKMARKS.map(bm => (
          <button key={bm.url} onClick={() => navigate(bm.url)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:bg-muted/40 whitespace-nowrap shrink-0 transition-colors">
            <span className="text-[10px]">{bm.icon}</span><span>{bm.name}</span>
          </button>
        ))}
      </div>

      {/* Shields Panel */}
      {showShields && (
        <div className="absolute top-[72px] right-12 w-72 bg-popover border border-border rounded-lg shadow-2xl z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 px-4 py-3 border-b border-border/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-orange-400" /><span className="text-xs font-bold text-foreground">Brave Shields</span></div>
              <button onClick={() => setShieldsUp(!shieldsUp)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center ${shieldsUp ? 'bg-orange-500 justify-end' : 'bg-muted/50 justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow" />
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground">{shieldsUp ? 'Shields are UP for this site' : 'Shields are DOWN for this site'}</div>
          </div>
          {shieldsUp && (
            <div className="p-3 space-y-2.5">
              {[
                { label: 'Ads & Trackers Blocked', value: stats.adsBlocked.toLocaleString(), icon: <Eye size={12} />, color: 'text-orange-400' },
                { label: 'Cross-site Trackers Blocked', value: stats.trackersBlocked.toLocaleString(), icon: <EyeOff size={12} />, color: 'text-red-400' },
                { label: 'HTTPS Upgrades', value: stats.httpsUpgrades.toLocaleString(), icon: <Lock size={12} />, color: 'text-green-400' },
                { label: 'Bandwidth Saved', value: `${stats.bandwidthSaved} MB`, icon: <Zap size={12} />, color: 'text-blue-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className={`${item.color}`}>{item.icon}</div>
                  <div className="flex-1 text-[10px] text-muted-foreground">{item.label}</div>
                  <div className={`text-[11px] font-bold tabular-nums ${item.color}`}>{item.value}</div>
                </div>
              ))}
              <div className="border-t border-border/20 pt-2 mt-2">
                <div className="text-[10px] text-muted-foreground">⏱ Estimated time saved: <span className="text-foreground font-medium">{stats.timeSaved} min</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu */}
      {showMenu && (
        <div className="absolute top-[72px] right-2 w-52 bg-popover border border-border rounded-lg shadow-2xl z-50 py-1" onClick={e => e.stopPropagation()}>
          {[
            { label: 'New tab', icon: Plus, action: addTab },
            { label: 'New private window', icon: EyeOff, action: () => {} },
            null,
            { label: 'History', icon: Clock, action: () => { setShowHistory(true); setShowMenu(false); } },
            { label: 'Downloads', icon: Download, action: () => { setShowDownloads(true); setShowMenu(false); } },
            { label: 'Bookmarks', icon: Star, action: () => {} },
            null,
            { label: 'Brave Rewards', icon: Zap, action: () => {} },
            { label: 'Settings', icon: MoreVertical, action: () => {} },
          ].map((item, i) => item === null ? (
            <div key={i} className="border-t border-border/30 my-1" />
          ) : (
            <button key={i} onClick={() => { item.action(); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-foreground hover:bg-muted/50 text-left">
              <item.icon size={13} className="text-muted-foreground" />{item.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Context Menu */}
      {contextMenu && (
        <div className="fixed bg-popover border border-border rounded-lg shadow-2xl z-[999] py-1 w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          {[
            { label: 'New tab to the right', action: () => { addTab(); setContextMenu(null); } },
            { label: 'Add to new group', action: () => { createGroup(contextMenu.tabId); setContextMenu(null); } },
            ...(groups.length > 0 ? groups.map(g => ({ label: `Add to "${g.name}"`, action: () => { addToGroup(contextMenu.tabId, g.id); setContextMenu(null); } })) : []),
            ...(tabs.find(t => t.id === contextMenu.tabId)?.groupId ? [{ label: 'Remove from group', action: () => { removeFromGroup(contextMenu.tabId); setContextMenu(null); } }] : []),
            null,
            { label: 'Close tab', action: () => { closeTab(contextMenu.tabId); setContextMenu(null); } },
            { label: 'Close other tabs', action: () => { setTabs(prev => prev.filter(t => t.id === contextMenu.tabId)); setActiveTab(contextMenu.tabId); setContextMenu(null); } },
          ].map((item, i) => item === null ? (
            <div key={i} className="border-t border-border/30 my-1" />
          ) : (
            <button key={i} onClick={item.action} className="w-full px-3 py-1.5 text-[11px] text-foreground hover:bg-muted/50 text-left">{item.label}</button>
          ))}
        </div>
      )}

      {/* Downloads Panel */}
      {showDownloads && (
        <div className="absolute top-[72px] right-2 w-80 bg-popover border border-border rounded-lg shadow-2xl z-50 max-h-[400px] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-xs font-medium text-foreground">Downloads</span>
            <button onClick={() => setShowDownloads(false)} className="p-0.5 hover:bg-muted rounded"><X size={12} /></button>
          </div>
          <div className="overflow-y-auto max-h-[340px] p-2 space-y-2">
            {downloads.map(dl => (
              <div key={dl.id} className="bg-muted/30 rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  <FileText size={16} className="text-orange-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-foreground truncate font-medium">{dl.name}</div>
                    <div className="text-[10px] text-muted-foreground">{dl.size}</div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {dl.status === 'downloading' && <button onClick={() => setDownloads(prev => prev.map(d => d.id === dl.id ? { ...d, status: 'paused' } : d))} className="p-1 hover:bg-muted rounded"><Pause size={10} className="text-muted-foreground" /></button>}
                    {dl.status === 'paused' && <button onClick={() => setDownloads(prev => prev.map(d => d.id === dl.id ? { ...d, status: 'downloading' } : d))} className="p-1 hover:bg-muted rounded"><Play size={10} className="text-muted-foreground" /></button>}
                    <button onClick={() => setDownloads(prev => prev.filter(d => d.id !== dl.id))} className="p-1 hover:bg-muted rounded"><Trash2 size={10} className="text-muted-foreground" /></button>
                  </div>
                </div>
                {dl.status !== 'complete' && (
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${dl.status === 'paused' ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${dl.progress}%` }} />
                  </div>
                )}
                <div className="text-[9px] text-muted-foreground mt-1">
                  {dl.status === 'complete' ? '✓ Complete' : dl.status === 'paused' ? `⏸ Paused — ${Math.round(dl.progress)}%` : `${Math.round(dl.progress)}%`}
                </div>
              </div>
            ))}
            {downloads.length === 0 && <div className="text-center py-6 text-muted-foreground text-xs">No downloads</div>}
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="absolute top-[72px] right-2 w-80 bg-popover border border-border rounded-lg shadow-2xl z-50 max-h-[400px] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-xs font-medium text-foreground">History</span>
            <div className="flex gap-1">
              <button onClick={() => setHistory([])} className="text-[10px] text-orange-400 hover:underline">Clear all</button>
              <button onClick={() => setShowHistory(false)} className="p-0.5 hover:bg-muted rounded"><X size={12} /></button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[340px]">
            {history.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">No history yet</div>
            ) : (
              <>
                <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-medium bg-muted/20">Today</div>
                {history.map((h, i) => (
                  <button key={i} onClick={() => { navigate(h.url); setShowHistory(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/30 text-left">
                    <Globe size={11} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-foreground truncate">{h.title}</div>
                      <div className="text-[9px] text-muted-foreground truncate">{h.url}</div>
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0">{new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {isNewTab ? (
          <div className="h-full flex flex-col items-center justify-center bg-[hsl(var(--os-window-body))] p-8">
            <div className="mb-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3 shadow-lg shadow-orange-500/20">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">Brave</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">The browser that puts you first</div>
            </div>
            <div className="w-full max-w-md flex items-center gap-2 bg-muted/30 hover:bg-muted/40 rounded-full px-4 py-3 cursor-text border border-border/20 hover:border-orange-500/30 transition-all shadow-lg"
              onClick={() => urlRef.current?.focus()}>
              <Search size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Search Brave or type a URL</span>
            </div>
            <div className="flex items-center gap-6 mt-6 px-4 py-3 bg-muted/15 rounded-xl border border-border/10">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400 tabular-nums">{stats.adsBlocked.toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground">Trackers & ads<br/>blocked</div>
              </div>
              <div className="w-px h-8 bg-border/20" />
              <div className="text-center">
                <div className="text-lg font-bold text-green-400 tabular-nums">{stats.httpsUpgrades.toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground">HTTPS<br/>upgrades</div>
              </div>
              <div className="w-px h-8 bg-border/20" />
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400 tabular-nums">{stats.timeSaved} min</div>
                <div className="text-[9px] text-muted-foreground">Time<br/>saved</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-8 max-w-md">
              {SUGGESTED_SITES.map(site => (
                <button key={site.url} onClick={() => navigate(site.url)} 
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/30 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-muted/40 group-hover:bg-muted/60 flex items-center justify-center text-lg transition-colors">{site.icon}</div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">{site.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : current?.loading ? (
          <div className="h-full flex flex-col items-center justify-center bg-[hsl(var(--os-window-body))]">
            <RotateCw size={24} className="animate-spin text-orange-400 mb-3" />
            <div className="text-sm text-muted-foreground">Loading {current.title}...</div>
          </div>
        ) : current?.error ? (
          <div className="h-full flex flex-col items-center justify-center bg-[hsl(var(--os-window-body))] p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Shield size={28} className="text-destructive" />
            </div>
            <div className="text-lg font-semibold text-foreground mb-2">Couldn't load this page</div>
            <div className="text-sm text-muted-foreground mb-2 max-w-md font-mono text-orange-400">{current?.url}</div>
            <div className="text-xs text-muted-foreground mb-4">{current.error}</div>
            <div className="flex gap-2">
              <button onClick={() => navigate(current.url)} 
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 flex items-center gap-2">
                <RotateCw size={14} />Retry
              </button>
              <button onClick={() => window.open(current?.url, '_blank')} 
                className="px-4 py-2 bg-muted/30 text-foreground rounded-lg text-sm hover:bg-muted/50 flex items-center gap-2">
                <ExternalLink size={14} />Open externally
              </button>
            </div>
          </div>
        ) : current?.htmlContent ? (
          <iframe
            ref={iframeRef}
            srcDoc={current.htmlContent}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-forms allow-popups"
            title="browser-content"
            style={{ background: '#fff' }}
          />
        ) : null}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-0.5 bg-secondary/10 border-t border-border/10 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock size={9} className="text-green-500" />
          <span>{current?.url || 'brave://newtab'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><ShieldCheck size={9} className="text-orange-400" />{shieldsUp ? 'Shields UP' : 'Shields DOWN'}</span>
          <span>{tabs.length} tab{tabs.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
