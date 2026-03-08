import React, { useState } from 'react';

const SAMPLE_CODE = `// Welcome to Scribe Code Editor
import React from 'react';

interface Props {
  name: string;
  age: number;
}

export default function Greeting({ name, age }: Props) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log(\`Hello, \${name}!\`);
  }, [name]);

  return (
    <div className="container">
      <h1>Hello, {name}!</h1>
      <p>You are {age} years old</p>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}`;

export default function CodeEditorApp() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [fileName, setFileName] = useState('app.tsx');
  const lines = code.split('\n');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 border-b border-border/30">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-muted/50 rounded text-[11px] text-primary">
          <span>📝</span>
          <input
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            className="bg-transparent outline-none w-24"
          />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div className="py-3 px-2 text-right select-none bg-secondary/10 border-r border-border/20">
          {lines.map((_, i) => (
            <div key={i} className="text-[11px] font-mono text-muted-foreground/50 leading-5 h-5">{i + 1}</div>
          ))}
        </div>
        {/* Code */}
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          className="flex-1 bg-transparent p-3 text-[12px] font-mono resize-none outline-none text-os-terminal-green leading-5 scrollbar-os"
          spellCheck={false}
          wrap="off"
        />
      </div>
      <div className="px-3 py-1 bg-secondary/20 border-t border-border/30 text-[10px] text-muted-foreground flex gap-4">
        <span>TypeScript React</span>
        <span>Ln {lines.length}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
