import React, { useState } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, Search } from 'lucide-react';

export default function BrowserApp() {
  const [url, setUrl] = useState('https://example.com');
  const [loading, setLoading] = useState(false);

  const navigate = (newUrl: string) => {
    let finalUrl = newUrl;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    setUrl(finalUrl);
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border/30">
        <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground"><ArrowLeft size={14} /></button>
        <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground"><ArrowRight size={14} /></button>
        <button onClick={() => navigate(url)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1.5">
          <Globe size={12} className="text-muted-foreground shrink-0" />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(url)}
            className="flex-1 bg-transparent text-xs outline-none text-foreground"
          />
          <Search size={12} className="text-muted-foreground shrink-0" />
        </div>
      </div>
      <div className="flex-1 bg-foreground/5 flex items-center justify-center">
        <div className="text-center p-8">
          <Globe size={48} className="mx-auto mb-4 text-primary/40" />
          <p className="text-sm text-muted-foreground">Web browsing is simulated</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Sandboxed for security — no external requests</p>
        </div>
      </div>
    </div>
  );
}
