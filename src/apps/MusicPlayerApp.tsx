import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, ListMusic, Music2 } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artist: string;
  duration: number;
  color: string;
}

const DEMO_TRACKS: Track[] = [
  { id: '1', name: 'Midnight Drive', artist: 'Synthwave FM', duration: 234, color: 'from-purple-500 to-blue-500' },
  { id: '2', name: 'Neon Dreams', artist: 'RetroWave', duration: 198, color: 'from-pink-500 to-orange-500' },
  { id: '3', name: 'Digital Horizon', artist: 'CyberPulse', duration: 312, color: 'from-cyan-500 to-green-500' },
  { id: '4', name: 'Binary Sunset', artist: 'DataStream', duration: 267, color: 'from-yellow-500 to-red-500' },
  { id: '5', name: 'Ghost Protocol', artist: 'DarkNet Audio', duration: 189, color: 'from-indigo-500 to-purple-500' },
  { id: '6', name: 'Electric Rain', artist: 'Volt', duration: 245, color: 'from-teal-500 to-blue-500' },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${(Math.floor(s) % 60).toString().padStart(2, '0')}`;

export default function MusicPlayerApp({ windowId }: { windowId: string }) {
  const [tracks] = useState(DEMO_TRACKS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [waveform, setWaveform] = useState<number[]>(Array(40).fill(0));
  const intervalRef = useRef<number>();

  const current = tracks[currentIdx];

  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(() => {
        setProgress(p => {
          if (p >= current.duration) {
            if (repeat) return 0;
            setCurrentIdx(i => (i + 1) % tracks.length);
            return 0;
          }
          return p + 0.5;
        });
        setWaveform(Array(40).fill(0).map(() => Math.random() * 0.8 + 0.2));
      }, 500);
    } else {
      clearInterval(intervalRef.current);
      setWaveform(prev => prev.map(v => v * 0.3));
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, current.duration, repeat, tracks.length]);

  const play = (idx: number) => { setCurrentIdx(idx); setProgress(0); setPlaying(true); };
  const next = () => { const i = shuffle ? Math.floor(Math.random() * tracks.length) : (currentIdx + 1) % tracks.length; play(i); };
  const prev = () => { if (progress > 3) { setProgress(0); } else { play((currentIdx - 1 + tracks.length) % tracks.length); } };

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      {/* Album art / visualizer */}
      <div className={`relative h-44 bg-gradient-to-br ${current.color} flex items-end justify-center p-4 shrink-0`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex items-end gap-[2px] h-16">
          {waveform.map((v, i) => (
            <div key={i} className="w-[3px] bg-white/80 rounded-t transition-all duration-300" style={{ height: `${v * 100}%` }} />
          ))}
        </div>
        <div className="absolute top-3 left-3 text-white/80">
          <Music2 size={20} />
        </div>
      </div>

      {/* Now playing */}
      <div className="px-4 py-3 text-center border-b border-border/10">
        <div className="text-sm font-semibold text-foreground">{current.name}</div>
        <div className="text-[11px] text-muted-foreground">{current.artist}</div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2">
        <div className="h-1 bg-muted/30 rounded-full cursor-pointer" onClick={e => {
          const r = e.currentTarget.getBoundingClientRect();
          setProgress((e.clientX - r.left) / r.width * current.duration);
        }}>
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(progress / current.duration) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>{fmt(progress)}</span>
          <span>{fmt(current.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-2">
        <button onClick={() => setShuffle(!shuffle)} className={`p-1.5 rounded ${shuffle ? 'text-primary' : 'text-muted-foreground'} hover:bg-muted/30`}>
          <Shuffle size={14} />
        </button>
        <button onClick={prev} className="p-2 text-foreground hover:bg-muted/30 rounded-full"><SkipBack size={16} /></button>
        <button onClick={() => setPlaying(!playing)} className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button onClick={next} className="p-2 text-foreground hover:bg-muted/30 rounded-full"><SkipForward size={16} /></button>
        <button onClick={() => setRepeat(!repeat)} className={`p-1.5 rounded ${repeat ? 'text-primary' : 'text-muted-foreground'} hover:bg-muted/30`}>
          <Repeat size={14} />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-6 pb-2">
        <button onClick={() => setMuted(!muted)} className="text-muted-foreground">
          {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
        <div className="flex-1 h-1 bg-muted/30 rounded-full cursor-pointer" onClick={e => {
          const r = e.currentTarget.getBoundingClientRect();
          setVolume((e.clientX - r.left) / r.width);
        }}>
          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
        </div>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto scrollbar-os border-t border-border/10">
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
          <ListMusic size={10} /> Playlist • {tracks.length} tracks
        </div>
        {tracks.map((t, i) => (
          <button key={t.id} onClick={() => play(i)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/20 transition-colors ${i === currentIdx ? 'bg-primary/10' : ''}`}>
            <div className={`w-8 h-8 rounded bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-[10px] shrink-0`}>
              {i === currentIdx && playing ? '▶' : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[11px] truncate ${i === currentIdx ? 'text-primary font-medium' : 'text-foreground'}`}>{t.name}</div>
              <div className="text-[10px] text-muted-foreground">{t.artist}</div>
            </div>
            <span className="text-[10px] text-muted-foreground">{fmt(t.duration)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
