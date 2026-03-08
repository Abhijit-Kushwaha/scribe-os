import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward, Film } from 'lucide-react';

const SAMPLE_VIDEOS = [
  { name: 'Big Buck Bunny', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: '9:56' },
  { name: 'Elephant Dream', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: '10:54' },
  { name: 'Sintel Trailer', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', duration: '14:48' },
];

export default function VideoPlayerApp({ windowId }: { windowId: string }) {
  const [videoIdx, setVideoIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  const v = SAMPLE_VIDEOS[videoIdx];
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause(); else videoRef.current.play();
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
  };

  const changeSpeed = () => {
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const loadVideo = (idx: number) => {
    setVideoIdx(idx); setPlaying(false); setCurrentTime(0);
    setTimeout(() => { if (videoRef.current) { videoRef.current.load(); } }, 100);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Video */}
      <div className="flex-1 relative flex items-center justify-center bg-black min-h-0">
        <video
          ref={videoRef}
          src={v.src}
          muted={muted}
          className="max-w-full max-h-full"
          onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
          onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
        />
        {!playing && (
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Play size={24} className="text-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[hsl(var(--os-window-body))] px-3 py-2 border-t border-border/20">
        {/* Progress */}
        <div className="h-1 bg-muted/30 rounded-full cursor-pointer mb-2" onClick={seek}>
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="text-foreground hover:text-primary">
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={() => loadVideo((videoIdx - 1 + SAMPLE_VIDEOS.length) % SAMPLE_VIDEOS.length)} className="text-muted-foreground hover:text-foreground"><SkipBack size={14} /></button>
          <button onClick={() => loadVideo((videoIdx + 1) % SAMPLE_VIDEOS.length)} className="text-muted-foreground hover:text-foreground"><SkipForward size={14} /></button>
          <span className="text-[10px] text-muted-foreground">{fmt(currentTime)} / {fmt(duration)}</span>
          <div className="flex-1" />
          <button onClick={changeSpeed} className="text-[10px] text-muted-foreground hover:text-foreground px-1">{speed}x</button>
          <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button onClick={() => videoRef.current?.requestFullscreen()} className="text-muted-foreground hover:text-foreground"><Maximize2 size={14} /></button>
        </div>
        {/* Playlist */}
        <div className="flex gap-1 mt-2 pt-2 border-t border-border/10">
          {SAMPLE_VIDEOS.map((sv, i) => (
            <button key={i} onClick={() => loadVideo(i)}
              className={`flex-1 px-2 py-1 rounded text-[9px] truncate transition-colors ${i === videoIdx ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}>
              <Film size={9} className="inline mr-0.5" />{sv.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
