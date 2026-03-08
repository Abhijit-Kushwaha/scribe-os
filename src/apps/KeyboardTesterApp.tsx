import React, { useState, useEffect } from 'react';

const ROWS = [
  ['Esc','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'],
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],
  ['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],
  ['Caps','A','S','D','F','G','H','J','K','L',';',"'",'Enter'],
  ['Shift','Z','X','C','V','B','N','M',',','.','/','Shift'],
  ['Ctrl','Win','Alt','Space','Alt','Fn','Menu','Ctrl'],
];

const KEY_MAP: Record<string, string> = {
  Escape: 'Esc', Backspace: 'Backspace', Tab: 'Tab', CapsLock: 'Caps', Enter: 'Enter',
  ShiftLeft: 'Shift', ShiftRight: 'Shift', ControlLeft: 'Ctrl', ControlRight: 'Ctrl',
  AltLeft: 'Alt', AltRight: 'Alt', MetaLeft: 'Win', MetaRight: 'Win', ' ': 'Space',
  '`': '`', '-': '-', '=': '=', '[': '[', ']': ']', '\\': '\\', ';': ';', "'": "'",
  ',': ',', '.': '.', '/': '/',
};

export default function KeyboardTesterApp({ windowId }: { windowId: string }) {
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<string[]>([]);
  const [totalPresses, setTotalPresses] = useState(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = KEY_MAP[e.code] || KEY_MAP[e.key] || e.key.toUpperCase();
      setPressed(p => new Set(p).add(key));
      setHistory(p => [key, ...p].slice(0, 20));
      setTotalPresses(p => p + 1);
    };
    const up = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code] || KEY_MAP[e.key] || e.key.toUpperCase();
      setPressed(p => { const n = new Set(p); n.delete(key); return n; });
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const getWidth = (key: string) => {
    if (key === 'Space') return 'flex-[5]';
    if (key === 'Backspace' || key === 'Enter') return 'flex-[2]';
    if (key === 'Tab' || key === 'Caps' || key === 'Shift') return 'flex-[1.5]';
    if (key === 'Ctrl' || key === 'Alt' || key === 'Win' || key === 'Fn' || key === 'Menu') return 'flex-[1.2]';
    return 'flex-1';
  };

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))] p-3">
      <div className="text-center mb-3">
        <div className="text-sm font-medium text-foreground">⌨️ Keyboard Tester</div>
        <div className="text-[10px] text-muted-foreground">Press any key • {totalPresses} presses</div>
      </div>

      <div className="flex flex-col gap-1 mb-3">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((key, ki) => (
              <button key={`${ri}-${ki}`}
                className={`${getWidth(key)} h-8 rounded text-[9px] font-medium transition-all duration-100 border ${
                  pressed.has(key)
                    ? 'bg-primary text-primary-foreground border-primary scale-95 shadow-[0_0_10px_hsl(var(--os-glow)/0.4)]'
                    : 'bg-secondary/30 text-muted-foreground border-border/30 hover:bg-secondary/50'
                }`}>
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <div className="text-[9px] text-muted-foreground mb-1">Recent keys</div>
        <div className="flex flex-wrap gap-1">
          {history.map((k, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-muted/30 rounded text-[9px] text-foreground">{k}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
