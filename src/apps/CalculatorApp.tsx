import React, { useState, useCallback, useEffect } from 'react';
import { Delete } from 'lucide-react';

const BUTTONS = [
  ['C', '(', ')', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['±', '0', '.', '='],
];

const SCI_BUTTONS = [
  ['sin', 'cos', 'tan', 'π'],
  ['log', 'ln', '√', '^'],
  ['x²', 'x³', '!', '%'],
];

export default function CalculatorApp({ windowId }: { windowId: string }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [scientific, setScientific] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const evaluate = useCallback((expr: string): string => {
    try {
      let e = expr
        .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
        .replace(/π/g, `${Math.PI}`)
        .replace(/sin\(([^)]+)\)/g, (_, v) => `${Math.sin(parseFloat(v) * Math.PI / 180)}`)
        .replace(/cos\(([^)]+)\)/g, (_, v) => `${Math.cos(parseFloat(v) * Math.PI / 180)}`)
        .replace(/tan\(([^)]+)\)/g, (_, v) => `${Math.tan(parseFloat(v) * Math.PI / 180)}`)
        .replace(/log\(([^)]+)\)/g, (_, v) => `${Math.log10(parseFloat(v))}`)
        .replace(/ln\(([^)]+)\)/g, (_, v) => `${Math.log(parseFloat(v))}`)
        .replace(/√\(([^)]+)\)/g, (_, v) => `${Math.sqrt(parseFloat(v))}`)
        .replace(/(\d+)!/g, (_, v) => { let n = parseInt(v), r = 1; for (let i = 2; i <= n; i++) r *= i; return `${r}`; });
      const result = new Function(`return ${e}`)();
      const r = typeof result === 'number' ? (Number.isInteger(result) ? result.toString() : result.toFixed(10).replace(/0+$/, '').replace(/\.$/, '')) : 'Error';
      return r;
    } catch { return 'Error'; }
  }, []);

  const handleButton = useCallback((btn: string) => {
    if (btn === 'C') { setDisplay('0'); setExpression(''); return; }
    if (btn === '±') { setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d); return; }
    if (btn === '=') {
      const full = expression + display;
      const result = evaluate(full);
      setHistory(p => [{ expr: full, result }, ...p].slice(0, 50));
      setDisplay(result);
      setExpression('');
      return;
    }
    if (['÷', '×', '−', '+', '^'].includes(btn)) {
      setExpression(p => p + display + ' ' + btn + ' ');
      setDisplay('0');
      return;
    }
    if (['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(btn)) {
      setExpression(p => p + `${btn}(`);
      setDisplay('0');
      return;
    }
    if (btn === 'π') { setDisplay(`${Math.PI}`); return; }
    if (btn === 'x²') { setDisplay(d => `${Math.pow(parseFloat(d), 2)}`); return; }
    if (btn === 'x³') { setDisplay(d => `${Math.pow(parseFloat(d), 3)}`); return; }
    if (btn === '!') {
      const n = parseInt(display); let r = 1; for (let i = 2; i <= n; i++) r *= i;
      setDisplay(`${r}`); return;
    }
    if (btn === '%') { setDisplay(d => `${parseFloat(d) / 100}`); return; }
    if (btn === '(' || btn === ')') { setExpression(p => p + btn); return; }
    setDisplay(d => d === '0' && btn !== '.' ? btn : d + btn);
  }, [display, expression, evaluate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (k >= '0' && k <= '9') handleButton(k);
      else if (k === '.') handleButton('.');
      else if (k === '+') handleButton('+');
      else if (k === '-') handleButton('−');
      else if (k === '*') handleButton('×');
      else if (k === '/') { e.preventDefault(); handleButton('÷'); }
      else if (k === 'Enter' || k === '=') handleButton('=');
      else if (k === 'Escape') handleButton('C');
      else if (k === 'Backspace') setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleButton]);

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))] font-mono-os">
      {/* Mode toggle */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/20 bg-secondary/5">
        <div className="flex gap-1">
          <button onClick={() => setScientific(false)} className={`px-3 py-1 text-[10px] font-medium rounded transition-all ${!scientific ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/30'}`}>Standard</button>
          <button onClick={() => setScientific(true)} className={`px-3 py-1 text-[10px] font-medium rounded transition-all ${scientific ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/30'}`}>Scientific</button>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className={`px-3 py-1 text-[10px] font-medium rounded transition-all ${showHistory ? 'bg-accent text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/30'}`}>History</button>
      </div>

      {/* Display */}
      <div className="px-4 py-4 text-right border-b border-border/10 bg-gradient-to-b from-muted/5 to-transparent">
        <div className="text-[11px] text-muted-foreground h-5 truncate font-mono min-h-5">{expression || '\u00A0'}</div>
        <div className="text-3xl text-foreground font-bold truncate font-mono mt-1 transition-all duration-200">{display}</div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Buttons */}
        <div className="flex-1 flex flex-col p-2 gap-1.5 bg-secondary/3">
          {scientific && SCI_BUTTONS.map((row, ri) => (
            <div key={ri} className="flex gap-1.5 flex-1">
              {row.map(btn => (
                <button key={btn} onClick={() => handleButton(btn)}
                  className="flex-1 rounded-lg bg-secondary/50 text-foreground text-[10px] font-medium hover:bg-secondary/70 active:scale-95 transition-all shadow-sm">
                  {btn}
                </button>
              ))}
            </div>
          ))}
          {BUTTONS.map((row, ri) => (
            <div key={ri} className="flex gap-1.5 flex-1">
              {row.map(btn => (
                <button key={btn} onClick={() => handleButton(btn)}
                  className={`flex-1 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 ${
                    btn === '=' ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/20' :
                    ['÷','×','−','+'].includes(btn) ? 'bg-orange-500/80 text-white hover:bg-orange-600 shadow-orange-500/20' :
                    btn === 'C' ? 'bg-red-500/80 text-white hover:bg-red-600 shadow-red-500/20' :
                    'bg-blue-500/20 text-foreground hover:bg-blue-500/30'
                  }`}>
                  {btn}
                </button>
              ))}
            </div>
          ))}
          <div className="flex gap-1.5">
            <button onClick={() => setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')}
              className="flex-1 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted/70 flex items-center justify-center transition-all shadow-sm active:scale-95">
              <Delete size={14} />
            </button>
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="w-48 border-l border-border/20 overflow-hidden flex flex-col bg-gradient-to-b from-muted/10 to-transparent animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="px-3 py-2.5 border-b border-border/20 bg-secondary/10">
              <div className="text-xs font-semibold text-foreground">Calculation History</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-os">
              {history.length === 0 ? (
                <div className="text-[10px] text-muted-foreground/50 text-center mt-4">No history yet</div>
              ) : history.map((h, i) => (
                <button key={i} onClick={() => setDisplay(h.result)}
                  className="w-full text-right p-2 border-b border-border/5 hover:bg-muted/20 transition-colors group">
                  <div className="text-[9px] text-muted-foreground group-hover:text-muted-foreground/80 truncate font-mono">{h.expr}</div>
                  <div className="text-xs text-foreground font-semibold font-mono">{h.result}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
