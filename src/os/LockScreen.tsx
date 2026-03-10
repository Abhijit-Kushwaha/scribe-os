import React, { useState, useEffect, useRef } from 'react';
import { Lock, ChevronUp } from 'lucide-react';

interface Props {
  onUnlock: () => void;
  username?: string;
}

export default function LockScreen({ onUnlock, username = 'Scribe' }: Props) {
  const [time, setTime] = useState(new Date());
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (showPin) inputRef.current?.focus();
  }, [showPin]);

  const handleSubmit = () => {
    if (pin === '' || pin === '0000' || pin === '1234') {
      onUnlock();
    } else {
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (!showPin) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
        style={{ zIndex: 99998, background: 'linear-gradient(135deg, hsl(210 20% 6%) 0%, hsl(210 25% 12%) 50%, hsl(174 30% 8%) 100%)' }}
        onClick={() => setShowPin(true)}
        onKeyDown={() => setShowPin(true)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsla(174,60%,30%,0.08),transparent_70%)]" />
        <div className="text-7xl font-light text-foreground tracking-tight mb-2">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-lg text-muted-foreground mb-12">
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div className="flex flex-col items-center text-muted-foreground/60 animate-pulse">
          <ChevronUp size={20} />
          <span className="text-xs mt-1">Click to unlock</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center select-none"
      style={{ zIndex: 99998, background: 'linear-gradient(135deg, hsl(210 20% 6%) 0%, hsl(210 25% 12%) 50%, hsl(174 30% 8%) 100%)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsla(174,60%,30%,0.08),transparent_70%)] pointer-events-none" />
      
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-secondary/50 border-2 border-primary/30 flex items-center justify-center mb-4 os-glow">
        <span className="text-3xl">👤</span>
      </div>
      <div className="text-lg font-medium text-foreground mb-1">{username}</div>
      <div className="text-xs text-muted-foreground mb-6">admin</div>

      {/* PIN input */}
      <div className={`flex flex-col items-center gap-3 ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
        <div className="flex items-center gap-2 bg-secondary/30 rounded-full px-4 py-2 border border-border/30">
          <Lock size={14} className="text-muted-foreground" />
          <input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="PIN (Enter to unlock)"
            className="bg-transparent outline-none text-sm text-foreground w-40 placeholder:text-muted-foreground/50"
            maxLength={8}
          />
        </div>
        <button
          onClick={handleSubmit}
          className="px-6 py-1.5 rounded-full bg-primary/20 text-primary text-xs hover:bg-primary/30 transition-colors border border-primary/20"
        >
          Sign in
        </button>
        <p className="text-[10px] text-muted-foreground/50 mt-2">
          Hint: Press Enter with empty PIN or use "0000"
        </p>
      </div>
    </div>
  );
}
