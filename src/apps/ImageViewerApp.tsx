import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const SAMPLE_IMAGES = [
  { name: 'wallpaper.jpg', src: '/placeholder.svg', w: 1920, h: 1080 },
  { name: 'gradient_01.png', src: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4285f4"/><stop offset="100%" stop-color="#34a853"/></linearGradient></defs><rect fill="url(#g)" width="400" height="300"/></svg>'), w: 400, h: 300 },
  { name: 'pattern_02.png', src: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#1a1a2e" width="400" height="300"/><circle cx="200" cy="150" r="80" fill="#e94560" opacity="0.8"/><circle cx="140" cy="180" r="60" fill="#0f3460" opacity="0.7"/></svg>'), w: 400, h: 300 },
];

export default function ImageViewerApp({ windowId }: { windowId: string }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fit, setFit] = useState(true);
  const img = SAMPLE_IMAGES[idx];

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/20 bg-secondary/10 shrink-0">
        <button onClick={() => setZoom(z => Math.min(5, z + 0.25))} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><ZoomIn size={14} /></button>
        <button onClick={() => setZoom(z => Math.max(0.1, z - 0.25))} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><ZoomOut size={14} /></button>
        <span className="text-[10px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <div className="w-px h-4 bg-border/30" />
        <button onClick={() => setRotation(r => r + 90)} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><RotateCw size={14} /></button>
        <button onClick={() => { setFit(!fit); setZoom(1); setRotation(0); }} className="p-1 rounded hover:bg-muted/40 text-muted-foreground"><Maximize2 size={14} /></button>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">{img.name} • {img.w}×{img.h}</span>
      </div>

      {/* Image area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[hsl(var(--os-terminal-bg))]">
        <button onClick={() => setIdx(i => (i - 1 + SAMPLE_IMAGES.length) % SAMPLE_IMAGES.length)}
          className="absolute left-2 z-10 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"><ChevronLeft size={16} /></button>
        <img
          src={img.src}
          alt={img.name}
          className="max-w-full max-h-full transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            objectFit: fit ? 'contain' : 'none',
          }}
          draggable={false}
        />
        <button onClick={() => setIdx(i => (i + 1) % SAMPLE_IMAGES.length)}
          className="absolute right-2 z-10 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"><ChevronRight size={16} /></button>
      </div>

      {/* Thumbnails */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border/20 bg-secondary/5 overflow-x-auto scrollbar-os">
        {SAMPLE_IMAGES.map((im, i) => (
          <button key={i} onClick={() => { setIdx(i); setZoom(1); setRotation(0); }}
            className={`w-10 h-10 rounded overflow-hidden border-2 shrink-0 transition-colors ${i === idx ? 'border-primary' : 'border-transparent hover:border-muted'}`}>
            <img src={im.src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
