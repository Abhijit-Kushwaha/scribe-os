import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Files, Search, GitBranch, Bug, Blocks, Settings, ChevronRight, ChevronDown,
  X, MoreHorizontal, Play, SplitSquareHorizontal, PanelBottom, Bell,
  Check, AlertTriangle, Info, Terminal as TerminalIcon, FileText, FileCode,
  FolderOpen, Folder, Plus, Trash2, RefreshCw, Copy, Save
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface VFile {
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
}

interface VFolder {
  name: string;
  path: string;
  children: (VFolder | VFile)[];
  expanded: boolean;
}

type TreeNode = VFolder | VFile;
const isFolder = (n: TreeNode): n is VFolder => 'children' in n;
const isFile = (n: TreeNode): n is VFile => !isFolder(n);

// ─── Language detection ──────────────────────────────────────────────
function detectLang(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TypeScript React', js: 'JavaScript', jsx: 'JavaScript React',
    json: 'JSON', html: 'HTML', css: 'CSS', scss: 'SCSS', md: 'Markdown',
    py: 'Python', rs: 'Rust', go: 'Go', java: 'Java', c: 'C', cpp: 'C++',
    yaml: 'YAML', yml: 'YAML', toml: 'TOML', sh: 'Shell', bash: 'Shell',
    sql: 'SQL', graphql: 'GraphQL', xml: 'XML', svg: 'SVG',
  };
  return map[ext] || 'Plain Text';
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const colors: Record<string, string> = {
    ts: 'text-blue-400', tsx: 'text-blue-300', js: 'text-yellow-400', jsx: 'text-yellow-300',
    json: 'text-yellow-500', html: 'text-orange-400', css: 'text-blue-500', scss: 'text-pink-400',
    md: 'text-gray-400', py: 'text-green-400', rs: 'text-orange-500', go: 'text-cyan-400',
    svg: 'text-yellow-300', sql: 'text-red-400',
  };
  return colors[ext] || 'text-muted-foreground';
}

// ─── Syntax tokenizer ────────────────────────────────────────────────
interface Token { text: string; type: string; }

function tokenizeLine(line: string, lang: string): Token[] {
  const tokens: Token[] = [];
  const keywords = new Set([
    'import', 'export', 'default', 'from', 'const', 'let', 'var', 'function', 'return',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'class', 'extends', 'implements', 'interface', 'type', 'enum', 'namespace',
    'new', 'this', 'super', 'typeof', 'instanceof', 'void', 'null', 'undefined',
    'true', 'false', 'try', 'catch', 'finally', 'throw', 'async', 'await',
    'yield', 'delete', 'in', 'of', 'as', 'is', 'keyof', 'readonly', 'declare',
    'module', 'require', 'public', 'private', 'protected', 'static', 'abstract',
    'override', 'satisfies', 'using',
  ]);
  const builtins = new Set([
    'console', 'window', 'document', 'Math', 'JSON', 'Array', 'Object', 'String',
    'Number', 'Boolean', 'Promise', 'Map', 'Set', 'RegExp', 'Error', 'Date',
    'parseInt', 'parseFloat', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'fetch', 'Response', 'Request', 'URL', 'URLSearchParams',
  ]);
  const reactHooks = new Set([
    'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext',
    'useReducer', 'useLayoutEffect', 'useImperativeHandle', 'useDebugValue', 'useId',
  ]);
  const jsxTags = /^<\/?([A-Za-z][A-Za-z0-9.]*)/;

  let i = 0;
  while (i < line.length) {
    // Comments
    if (line.slice(i, i + 2) === '//') {
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }
    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ text: line.slice(i, j + 1), type: 'string' });
      i = j + 1;
      continue;
    }
    // Numbers
    if (/[0-9]/.test(line[i]) && (i === 0 || /[\s(,=+\-*/<>[\]{}:;!&|^~%?]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9.xXa-fA-FeEbBoO_n]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: 'number' });
      i = j;
      continue;
    }
    // JSX tags
    if (line[i] === '<' && jsxTags.test(line.slice(i))) {
      const match = line.slice(i).match(jsxTags)!;
      const isClosing = line[i + 1] === '/';
      tokens.push({ text: isClosing ? '</' : '<', type: 'punctuation' });
      i += isClosing ? 2 : 1;
      tokens.push({ text: match[1], type: 'tag' });
      i += match[1].length;
      continue;
    }
    // Decorators
    if (line[i] === '@' && /[A-Za-z]/.test(line[i + 1] || '')) {
      let j = i + 1;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: 'decorator' });
      i = j;
      continue;
    }
    // Words
    if (/[A-Za-z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let type = 'text';
      if (keywords.has(word)) type = 'keyword';
      else if (builtins.has(word)) type = 'builtin';
      else if (reactHooks.has(word)) type = 'hook';
      else if (/^[A-Z]/.test(word)) type = 'type';
      else if (line[j] === '(') type = 'function';
      i = j;
      tokens.push({ text: word, type });
      continue;
    }
    // Operators
    if (/[=+\-*/<>!&|^~%?:]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[=+\-*/<>!&|^~%?:]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: 'operator' });
      i = j;
      continue;
    }
    // Brackets
    if (/[()[\]{}]/.test(line[i])) {
      tokens.push({ text: line[i], type: 'bracket' });
      i++;
      continue;
    }
    // Punctuation
    if (/[;,.]/.test(line[i])) {
      tokens.push({ text: line[i], type: 'punctuation' });
      i++;
      continue;
    }
    // Whitespace & other
    tokens.push({ text: line[i], type: 'text' });
    i++;
  }
  return tokens;
}

const TOKEN_COLORS: Record<string, string> = {
  keyword: 'text-purple-400',
  builtin: 'text-cyan-300',
  hook: 'text-yellow-300',
  type: 'text-green-300',
  function: 'text-yellow-200',
  string: 'text-orange-300',
  number: 'text-green-400',
  comment: 'text-gray-500 italic',
  operator: 'text-cyan-400',
  bracket: 'text-yellow-100/80',
  punctuation: 'text-gray-400',
  tag: 'text-red-400',
  decorator: 'text-yellow-400',
  text: 'text-gray-200',
};

// ─── Sample project structure ────────────────────────────────────────
const SAMPLE_FILES: VFile[] = [
  {
    name: 'App.tsx', path: '/src/App.tsx', language: 'TypeScript React', isModified: false,
    content: `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}`,
  },
  {
    name: 'Home.tsx', path: '/src/pages/Home.tsx', language: 'TypeScript React', isModified: false,
    content: `import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Zap, Shield } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  { icon: <Zap className="w-5 h-5" />, title: 'Lightning Fast', description: 'Optimized for performance' },
  { icon: <Shield className="w-5 h-5" />, title: 'Secure', description: 'Enterprise-grade security' },
  { icon: <Star className="w-5 h-5" />, title: 'Beautiful', description: 'Crafted with care' },
];

export default function Home() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = 'Home | My App';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-bold">MyApp</h1>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold mb-4">Build Amazing Things</h2>
        <p className="text-muted-foreground text-lg mb-8">
          A modern full-stack application template.
        </p>
        <div className="grid grid-cols-3 gap-6 mt-12">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-lg border bg-card">
              <div className="mb-3 text-primary">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 p-4 rounded bg-muted/50">
          <p>Counter: {count}</p>
          <Button onClick={() => setCount(c => c + 1)} className="mt-2">
            Increment
          </Button>
        </div>
      </main>
    </div>
  );
}`,
  },
  {
    name: 'Dashboard.tsx', path: '/src/pages/Dashboard.tsx', language: 'TypeScript React', isModified: false,
    content: `import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  users: number;
  revenue: number;
  orders: number;
  growth: number;
}

async function fetchStats(): Promise<Stats> {
  // Simulated API call
  await new Promise(r => setTimeout(r, 800));
  return { users: 2847, revenue: 54230, orders: 1283, growth: 12.5 };
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard title="Users" value={data!.users.toLocaleString()} />
            <StatCard title="Revenue" value={\`$\${data!.revenue.toLocaleString()}\`} />
            <StatCard title="Orders" value={data!.orders.toLocaleString()} />
            <StatCard title="Growth" value={\`\${data!.growth}%\`} />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}`,
  },
  {
    name: 'utils.ts', path: '/src/lib/utils.ts', language: 'TypeScript', isModified: false,
    content: `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}`,
  },
  {
    name: 'package.json', path: '/package.json', language: 'JSON', isModified: false,
    content: `{
  "name": "my-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "@tanstack/react-query": "^5.83.0",
    "lucide-react": "^0.462.0",
    "tailwind-merge": "^2.6.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}`,
  },
  {
    name: 'tsconfig.json', path: '/tsconfig.json', language: 'JSON', isModified: false,
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}`,
  },
  {
    name: '.env', path: '/.env', language: 'Plain Text', isModified: false,
    content: `VITE_SUPABASE_URL=https://example.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=MyApp`,
  },
  {
    name: 'README.md', path: '/README.md', language: 'Markdown', isModified: false,
    content: `# My Application

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- ⚡ Lightning fast with Vite
- 🎨 Beautiful UI with Tailwind CSS
- 🔒 Type-safe with TypeScript
- 📊 Data fetching with React Query

## Project Structure

\`\`\`
src/
├── components/   # Reusable UI components
├── pages/        # Route pages
├── lib/          # Utility functions
├── hooks/        # Custom React hooks
└── App.tsx       # Root component
\`\`\``,
  },
];

function buildTree(files: VFile[]): VFolder {
  const root: VFolder = { name: 'my-app', path: '/', children: [], expanded: true };
  
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      const folderPath = '/' + parts.slice(0, i + 1).join('/');
      let folder = current.children.find(c => isFolder(c) && c.name === folderName) as VFolder | undefined;
      if (!folder) {
        folder = { name: folderName, path: folderPath, children: [], expanded: true };
        current.children.push(folder);
      }
      current = folder;
    }
    current.children.push(file);
  }
  
  // Sort: folders first, then alphabetical
  const sortChildren = (node: VFolder) => {
    node.children.sort((a, b) => {
      if (isFolder(a) && !isFolder(b)) return -1;
      if (!isFolder(a) && isFolder(b)) return 1;
      return a.name.localeCompare(b.name);
    });
    node.children.filter(isFolder).forEach(sortChildren);
  };
  sortChildren(root);
  return root;
}

// ─── Components ──────────────────────────────────────────────────────

function ActivityBar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  const items = [
    { id: 'explorer', icon: Files, tooltip: 'Explorer' },
    { id: 'search', icon: Search, tooltip: 'Search' },
    { id: 'git', icon: GitBranch, tooltip: 'Source Control' },
    { id: 'debug', icon: Bug, tooltip: 'Run and Debug' },
    { id: 'extensions', icon: Blocks, tooltip: 'Extensions' },
  ];

  return (
    <div className="w-12 flex flex-col items-center py-1 bg-[#181818] border-r border-[#2b2b2b] shrink-0">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(active === item.id ? '' : item.id)}
          className={`w-12 h-11 flex items-center justify-center relative transition-colors ${
            active === item.id
              ? 'text-white before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-white before:rounded-r'
              : 'text-gray-500 hover:text-gray-300'
          }`}
          title={item.tooltip}
        >
          <item.icon size={22} strokeWidth={1.5} />
        </button>
      ))}
      <div className="flex-1" />
      <button className="w-12 h-11 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors" title="Settings">
        <Settings size={22} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function FileTreeItem({ node, depth, onSelect, selectedPath, onToggle, onDelete, onNewFile, onNewFolder, newItemState, onNewItemSubmit, onNewItemCancel }: {
  node: TreeNode; depth: number; onSelect: (file: VFile) => void; selectedPath: string; onToggle: (path: string) => void;
  onDelete: (path: string) => void; onNewFile: (folderPath: string) => void; onNewFolder: (folderPath: string) => void;
  newItemState: { folderPath: string; type: 'file' | 'folder' } | null;
  onNewItemSubmit: (name: string) => void; onNewItemCancel: () => void;
}) {
  const [showCtx, setShowCtx] = useState(false);
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 });
  const ctxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCtx) return;
    const close = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setShowCtx(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showCtx]);

  const handleCtx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setShowCtx(true);
  };

  const ctxMenu = showCtx && (
    <div ref={ctxRef} className="fixed z-[9999] bg-[#2d2d30] border border-[#454545] rounded shadow-xl py-1 min-w-[160px] text-[12px]" style={{ left: ctxPos.x, top: ctxPos.y }}>
      {isFolder(node) && (
        <>
          <button className="w-full text-left px-3 py-1 text-gray-200 hover:bg-[#094771]" onClick={() => { setShowCtx(false); onNewFile(node.path); }}>New File</button>
          <button className="w-full text-left px-3 py-1 text-gray-200 hover:bg-[#094771]" onClick={() => { setShowCtx(false); onNewFolder(node.path); }}>New Folder</button>
          <div className="border-t border-[#454545] my-1" />
        </>
      )}
      <button className="w-full text-left px-3 py-1 text-gray-200 hover:bg-[#094771]" onClick={() => { setShowCtx(false); onDelete(node.path); }}>Delete</button>
    </div>
  );

  if (isFolder(node)) {
    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          onContextMenu={handleCtx}
          className={`w-full flex items-center gap-1 py-[2px] pr-2 text-[13px] hover:bg-[#2a2d2e] transition-colors group`}
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          {node.expanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
          {node.expanded ? <FolderOpen size={15} className="text-yellow-500/80 shrink-0" /> : <Folder size={15} className="text-yellow-600/70 shrink-0" />}
          <span className="truncate text-gray-300 ml-0.5">{node.name}</span>
        </button>
        {node.expanded && node.children.map(child => (
          <FileTreeItem key={child.path} node={child} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} onToggle={onToggle} onDelete={onDelete} onNewFile={onNewFile} onNewFolder={onNewFolder} newItemState={newItemState} onNewItemSubmit={onNewItemSubmit} onNewItemCancel={onNewItemCancel} />
        ))}
        {node.expanded && newItemState && newItemState.folderPath === node.path && (
          <NewItemInput type={newItemState.type} depth={depth + 1} onSubmit={onNewItemSubmit} onCancel={onNewItemCancel} />
        )}
        {ctxMenu}
      </div>
    );
  }

  const isActive = selectedPath === node.path;
  return (
    <>
      <button
        onClick={() => onSelect(node)}
        onContextMenu={handleCtx}
        className={`w-full flex items-center gap-1 py-[2px] pr-2 text-[13px] transition-colors ${
          isActive ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]'
        }`}
        style={{ paddingLeft: depth * 12 + 22 }}
      >
        <FileCode size={15} className={`${fileIcon(node.name)} shrink-0`} />
        <span className={`truncate ml-0.5 ${isActive ? 'text-white' : 'text-gray-300'}`}>{node.name}</span>
        {node.isModified && <span className="ml-auto w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
      </button>
      {ctxMenu}
    </>
  );
}

function NewItemInput({ type, depth, onSubmit, onCancel }: { type: 'file' | 'folder'; depth: number; onSubmit: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <div className="flex items-center gap-1 py-[2px] pr-2" style={{ paddingLeft: depth * 12 + (type === 'file' ? 22 : 4) }}>
      {type === 'folder' ? <Folder size={15} className="text-yellow-600/70 shrink-0" /> : <FileCode size={15} className="text-gray-400 shrink-0" />}
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) onSubmit(value.trim());
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => { if (value.trim()) onSubmit(value.trim()); else onCancel(); }}
        className="flex-1 bg-[#3c3c3c] border border-[#007acc] rounded px-1 py-0 text-[13px] text-gray-200 outline-none"
      />
    </div>
  );
}

function Sidebar({ tree, onSelect, selectedPath, onToggle, sidebarPanel, onDelete, onNewFile, onNewFolder, newItemState, onNewItemSubmit, onNewItemCancel }: {
  tree: VFolder; onSelect: (file: VFile) => void; selectedPath: string; onToggle: (path: string) => void; sidebarPanel: string;
  onDelete: (path: string) => void; onNewFile: (folderPath: string) => void; onNewFolder: (folderPath: string) => void;
  newItemState: { folderPath: string; type: 'file' | 'folder' } | null;
  onNewItemSubmit: (name: string) => void; onNewItemCancel: () => void;
}) {
  if (sidebarPanel === 'explorer') {
    return (
      <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
        <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Explorer</div>
        <div className="flex items-center justify-between px-3 py-1 text-[11px] font-semibold text-gray-300 uppercase tracking-wide bg-[#1e1e1e]">
          <span>{tree.name}</span>
          <div className="flex gap-1">
            <button className="p-0.5 hover:bg-[#383838] rounded" title="New File" onClick={() => onNewFile(tree.path)}><Plus size={14} className="text-gray-400" /></button>
            <button className="p-0.5 hover:bg-[#383838] rounded" title="New Folder" onClick={() => onNewFolder(tree.path)}><FolderOpen size={14} className="text-gray-400" /></button>
            <button className="p-0.5 hover:bg-[#383838] rounded"><RefreshCw size={14} className="text-gray-400" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-os text-[13px]">
          {tree.children.map(child => (
            <FileTreeItem key={child.path} node={child} depth={0} onSelect={onSelect} selectedPath={selectedPath} onToggle={onToggle} onDelete={onDelete} onNewFile={onNewFile} onNewFolder={onNewFolder} newItemState={newItemState} onNewItemSubmit={onNewItemSubmit} onNewItemCancel={onNewItemCancel} />
          ))}
          {newItemState && newItemState.folderPath === tree.path && (
            <NewItemInput type={newItemState.type} depth={0} onSubmit={onNewItemSubmit} onCancel={onNewItemCancel} />
          )}
        </div>
      </div>
    );
  }

  if (sidebarPanel === 'search') {
    return (
      <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
        <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Search</div>
        <div className="px-3 py-1">
          <input
            className="w-full bg-[#3c3c3c] border border-[#555] rounded px-2 py-1 text-[13px] text-gray-200 outline-none focus:border-[#007acc] transition-colors"
            placeholder="Search"
          />
          <input
            className="w-full bg-[#3c3c3c] border border-[#555] rounded px-2 py-1 text-[13px] text-gray-200 outline-none focus:border-[#007acc] mt-1 transition-colors"
            placeholder="Replace"
          />
        </div>
        <div className="px-4 py-3 text-[12px] text-gray-500">Search to find results across files</div>
      </div>
    );
  }

  if (sidebarPanel === 'git') {
    return (
      <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
        <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Source Control</div>
        <div className="px-3 py-2">
          <input
            className="w-full bg-[#3c3c3c] border border-[#555] rounded px-2 py-1 text-[13px] text-gray-200 outline-none focus:border-[#007acc] transition-colors"
            placeholder="Message (Ctrl+Enter to commit)"
          />
        </div>
        <div className="px-4 py-2 text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Changes</div>
        <div className="px-4 py-2 text-[12px] text-gray-500">No changes detected</div>
      </div>
    );
  }

  if (sidebarPanel === 'debug') {
    return (
      <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
        <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Run and Debug</div>
        <div className="px-4 py-6 text-center">
          <Play size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-[13px] text-gray-400 mb-2">Run and Debug</p>
          <p className="text-[12px] text-gray-500">To customize, create a launch.json file</p>
          <button className="mt-3 text-[13px] text-[#3794ff] hover:underline">create a launch.json file</button>
        </div>
      </div>
    );
  }

  if (sidebarPanel === 'extensions') {
    const exts = [
      { name: 'ESLint', author: 'Microsoft', desc: 'Integrates ESLint into VS Code', installed: true },
      { name: 'Prettier', author: 'Prettier', desc: 'Code formatter', installed: true },
      { name: 'Tailwind CSS IntelliSense', author: 'Tailwind Labs', desc: 'Intelligent Tailwind CSS tooling', installed: true },
      { name: 'GitLens', author: 'GitKraken', desc: 'Supercharge Git', installed: false },
      { name: 'Error Lens', author: 'Alexander', desc: 'Improve highlighting of errors', installed: false },
    ];
    return (
      <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
        <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Extensions</div>
        <div className="px-3 py-1">
          <input className="w-full bg-[#3c3c3c] border border-[#555] rounded px-2 py-1 text-[13px] text-gray-200 outline-none focus:border-[#007acc] transition-colors" placeholder="Search Extensions" />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-os">
          {exts.map(ext => (
            <div key={ext.name} className="flex items-start gap-2 px-3 py-2 hover:bg-[#2a2d2e] cursor-pointer">
              <div className="w-8 h-8 rounded bg-[#333] flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                <Blocks size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] text-gray-200 truncate">{ext.name}</div>
                <div className="text-[11px] text-gray-500">{ext.author}</div>
                <div className="text-[11px] text-gray-500 truncate">{ext.desc}</div>
              </div>
              {ext.installed && <Check size={14} className="text-green-400 shrink-0 mt-1 ml-auto" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function EditorTabs({ tabs, activeTab, onSelect, onClose }: {
  tabs: VFile[]; activeTab: string; onSelect: (path: string) => void; onClose: (path: string) => void;
}) {
  return (
    <div className="flex bg-[#1e1e1e] border-b border-[#2b2b2b] overflow-x-auto shrink-0" style={{ minHeight: 35 }}>
      {tabs.map(tab => {
        const active = tab.path === activeTab;
        return (
          <div
            key={tab.path}
            className={`flex items-center gap-1.5 px-3 h-[35px] text-[13px] cursor-pointer border-r border-[#2b2b2b] shrink-0 group ${
              active
                ? 'bg-[#1e1e1e] text-white border-t border-t-[#007acc]'
                : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e] border-t border-t-transparent'
            }`}
            onClick={() => onSelect(tab.path)}
          >
            <FileCode size={14} className={fileIcon(tab.name)} />
            <span className="truncate max-w-[120px]">{tab.name}</span>
            {tab.isModified && <span className="w-2 h-2 rounded-full bg-white/70 group-hover:hidden" />}
            <button
              onClick={e => { e.stopPropagation(); onClose(tab.path); }}
              className={`w-5 h-5 flex items-center justify-center rounded hover:bg-[#444] ${tab.isModified ? 'group-hover:flex' : ''}`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Breadcrumbs({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean);
  return (
    <div className="flex items-center gap-1 px-4 py-1 bg-[#1e1e1e] text-[12px] text-gray-400 border-b border-[#2b2b2b] shrink-0">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} className="text-gray-600" />}
          <span className={i === parts.length - 1 ? 'text-gray-200' : 'hover:text-gray-200 cursor-pointer'}>{part}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function Minimap({ lines, scrollPercent }: { lines: string[]; scrollPercent: number }) {
  const totalLines = lines.length;
  const visibleHeight = 80; // approximate visible area in minimap
  const mapHeight = Math.min(totalLines * 2, 300);
  const viewTop = scrollPercent * (mapHeight - visibleHeight);

  return (
    <div className="w-[60px] relative bg-[#1e1e1e] border-l border-[#2b2b2b] overflow-hidden shrink-0 select-none">
      {/* Viewport indicator */}
      <div
        className="absolute right-0 w-full bg-[#264f78]/30 border-y border-[#264f78]/50 pointer-events-none transition-transform"
        style={{ height: visibleHeight, transform: `translateY(${Math.max(0, viewTop)}px)` }}
      />
      {/* Code representation */}
      <div className="px-1 pt-1">
        {lines.slice(0, 150).map((line, i) => (
          <div key={i} className="h-[2px] mb-[1px] flex gap-[1px]">
            {line.trim().length > 0 && (
              <div
                className="h-full bg-gray-500/30 rounded-sm"
                style={{ width: Math.min(line.length * 0.5, 50) }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Command Palette ─────────────────────────────────────────────────

interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

function CommandPalette({ commands, onClose }: { commands: PaletteCommand[]; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd => {
      const text = `${cmd.category} ${cmd.label}`.toLowerCase();
      // fuzzy: all query chars must appear in order
      let qi = 0;
      for (let i = 0; i < text.length && qi < q.length; i++) {
        if (text[i] === q[qi]) qi++;
      }
      return qi === q.length;
    }).sort((a, b) => {
      const aExact = a.label.toLowerCase().includes(q) ? 0 : 1;
      const bExact = b.label.toLowerCase().includes(q) ? 0 : 1;
      return aExact - bExact;
    });
  }, [query, commands]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const execute = (cmd: PaletteCommand) => {
    onClose();
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && filtered[selectedIdx]) { execute(filtered[selectedIdx]); return; }
  };

  // Highlight matching chars
  const highlight = (text: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const q = query.toLowerCase();
    const result: React.ReactNode[] = [];
    let qi = 0;
    for (let i = 0; i < text.length; i++) {
      if (qi < q.length && text[i].toLowerCase() === q[qi]) {
        result.push(<span key={i} className="text-[#ffcc00] font-semibold">{text[i]}</span>);
        qi++;
      } else {
        result.push(<span key={i}>{text[i]}</span>);
      }
    }
    return <>{result}</>;
  };

  return (
    <div className="absolute inset-0 z-[9999] flex justify-center" onClick={onClose}>
      <div
        className="mt-0 w-[500px] max-h-[350px] bg-[#252526] border border-[#454545] rounded-b-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-3 py-2 border-b border-[#454545]">
          <span className="text-gray-400 mr-2 text-[13px]">{'>'}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-[13px] text-gray-200 outline-none placeholder:text-gray-500"
          />
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-os">
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-[12px] text-gray-500">No commands found</div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onMouseEnter={() => setSelectedIdx(i)}
              onClick={() => execute(cmd)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] transition-colors ${
                i === selectedIdx ? 'bg-[#094771] text-white' : 'text-gray-300 hover:bg-[#2a2d2e]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] text-gray-500 shrink-0 w-16 text-right">{cmd.category}</span>
                <span className="truncate">{highlight(cmd.label)}</span>
              </div>
              {cmd.shortcut && (
                <kbd className="text-[11px] text-gray-500 bg-[#333] rounded px-1.5 py-0.5 ml-2 shrink-0">{cmd.shortcut}</kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

  content: string; onChange: (content: string) => void; onClose: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const findRef = useRef<HTMLInputElement>(null);

  useEffect(() => { findRef.current?.focus(); }, []);

  const matches = useMemo(() => {
    if (!findText) return [];
    const results: { start: number; end: number }[] = [];
    try {
      let flags = 'g';
      if (!matchCase) flags += 'i';
      let pattern = useRegex ? findText : findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const regex = new RegExp(pattern, flags);
      let m;
      while ((m = regex.exec(content)) !== null) {
        results.push({ start: m.index, end: m.index + m[0].length });
        if (m[0].length === 0) break; // prevent infinite loop on empty match
      }
    } catch { /* invalid regex */ }
    return results;
  }, [findText, content, matchCase, wholeWord, useRegex]);

  const goToMatch = useCallback((idx: number) => {
    if (matches.length === 0) return;
    const i = ((idx % matches.length) + matches.length) % matches.length;
    setCurrentMatch(i);
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      ta.setSelectionRange(matches[i].start, matches[i].end);
      // Scroll to match
      const before = content.substring(0, matches[i].start);
      const line = before.split('\n').length - 1;
      ta.scrollTop = line * 20 - ta.clientHeight / 2;
    }
  }, [matches, content, textareaRef]);

  const handleNext = () => goToMatch(currentMatch + 1);
  const handlePrev = () => goToMatch(currentMatch - 1);

  const handleReplace = () => {
    if (matches.length === 0) return;
    const m = matches[currentMatch];
    if (!m) return;
    const newContent = content.substring(0, m.start) + replaceText + content.substring(m.end);
    onChange(newContent);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;
    try {
      let flags = 'g';
      if (!matchCase) flags += 'i';
      let pattern = useRegex ? findText : findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const regex = new RegExp(pattern, flags);
      onChange(content.replace(regex, replaceText));
    } catch { /* invalid regex */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNext(); }
    if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); handlePrev(); }
  };

  const ToggleBtn = ({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      title={title}
      className={`w-[26px] h-[22px] flex items-center justify-center rounded text-[11px] font-mono transition-colors ${
        active ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:bg-[#3c3c3c]'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="absolute top-0 right-[72px] z-50 bg-[#252526] border border-[#454545] rounded-bl shadow-xl flex flex-col" style={{ minWidth: 340 }}>
      <div className="flex items-center gap-1 px-2 py-1">
        <button onClick={() => setShowReplace(r => !r)} className="p-0.5 hover:bg-[#3c3c3c] rounded text-gray-400 shrink-0" title="Toggle Replace">
          <ChevronRight size={14} className={`transition-transform ${showReplace ? 'rotate-90' : ''}`} />
        </button>
        <div className="flex-1 flex items-center gap-1 bg-[#3c3c3c] border border-[#555] rounded px-1.5 h-[24px] focus-within:border-[#007acc]">
          <input
            ref={findRef}
            value={findText}
            onChange={e => { setFindText(e.target.value); setCurrentMatch(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[13px] text-gray-200 outline-none min-w-0"
            placeholder="Find"
          />
          <ToggleBtn active={matchCase} onClick={() => setMatchCase(c => !c)} title="Match Case">Aa</ToggleBtn>
          <ToggleBtn active={wholeWord} onClick={() => setWholeWord(w => !w)} title="Match Whole Word">ab</ToggleBtn>
          <ToggleBtn active={useRegex} onClick={() => setUseRegex(r => !r)} title="Use Regular Expression">.*</ToggleBtn>
        </div>
        <span className="text-[11px] text-gray-400 min-w-[60px] text-center shrink-0">
          {findText ? `${matches.length > 0 ? currentMatch + 1 : 'No'} of ${matches.length}` : 'No results'}
        </span>
        <button onClick={handlePrev} className="p-0.5 hover:bg-[#3c3c3c] rounded text-gray-400" title="Previous (Shift+Enter)">
          <ChevronRight size={14} className="-rotate-90" />
        </button>
        <button onClick={handleNext} className="p-0.5 hover:bg-[#3c3c3c] rounded text-gray-400" title="Next (Enter)">
          <ChevronRight size={14} className="rotate-90" />
        </button>
        <button onClick={onClose} className="p-0.5 hover:bg-[#3c3c3c] rounded text-gray-400" title="Close (Escape)">
          <X size={14} />
        </button>
      </div>
      {showReplace && (
        <div className="flex items-center gap-1 px-2 py-1 pl-[30px]">
          <div className="flex-1 flex items-center bg-[#3c3c3c] border border-[#555] rounded px-1.5 h-[24px] focus-within:border-[#007acc]">
            <input
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
              className="flex-1 bg-transparent text-[13px] text-gray-200 outline-none min-w-0"
              placeholder="Replace"
            />
          </div>
          <button onClick={handleReplace} className="p-0.5 hover:bg-[#3c3c3c] rounded text-gray-400 text-[11px] px-1" title="Replace">
            ⤿
          </button>
          <button onClick={handleReplaceAll} className="p-0.5 hover:bg-[#3c3c3c] rounded text-gray-400 text-[11px] px-1" title="Replace All">
            ⤿A
          </button>
        </div>
      )}
    </div>
  );
}

function CodeArea({ file, onChange, showFind, onCloseFind }: { file: VFile; onChange: (content: string) => void; showFind: boolean; onCloseFind: () => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);
  const codeDisplayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [scrollPercent, setScrollPercent] = useState(0);

  const lines = file.content.split('\n');
  const tokenizedLines = useMemo(() => lines.map(l => tokenizeLine(l, file.language)), [file.content, file.language]);

  const handleScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (lineNumberRef.current) lineNumberRef.current.scrollTop = ta.scrollTop;
    if (codeDisplayRef.current) {
      codeDisplayRef.current.scrollTop = ta.scrollTop;
      codeDisplayRef.current.scrollLeft = ta.scrollLeft;
    }
    const maxScroll = ta.scrollHeight - ta.clientHeight;
    setScrollPercent(maxScroll > 0 ? ta.scrollTop / maxScroll : 0);
  }, []);

  const handleCursor = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = ta.value.substring(0, ta.selectionStart);
    const lineNum = before.split('\n').length;
    const colNum = before.length - before.lastIndexOf('\n');
    setCursorLine(lineNum);
    setCursorCol(colNum);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [onChange]);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Find & Replace widget */}
      {showFind && (
        <FindReplaceWidget
          content={file.content}
          onChange={onChange}
          onClose={onCloseFind}
          textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
        />
      )}

      {/* Line numbers */}
      <div
        ref={lineNumberRef}
        className="py-1 pr-3 pl-4 text-right select-none bg-[#1e1e1e] overflow-hidden shrink-0"
        style={{ width: 60 }}
      >
        {lines.map((_, i) => (
          <div
            key={i}
            className={`text-[13px] font-mono leading-[20px] h-[20px] ${
              i + 1 === cursorLine ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Code display layer (syntax-highlighted, non-interactive) */}
      <div className="flex-1 relative overflow-hidden">
        {/* Current line highlight */}
        <div
          className="absolute left-0 right-0 bg-[#2a2d2e]/50 pointer-events-none"
          style={{
            top: (cursorLine - 1) * 20 + 4 - (textareaRef.current?.scrollTop || 0),
            height: 20,
          }}
        />

        <div
          ref={codeDisplayRef}
          className="absolute inset-0 py-1 px-3 overflow-hidden pointer-events-none"
          aria-hidden
        >
          {tokenizedLines.map((tokens, i) => (
            <div key={i} className="font-mono text-[13px] leading-[20px] h-[20px] whitespace-pre">
              {tokens.map((tok, j) => (
                <span key={j} className={TOKEN_COLORS[tok.type] || 'text-gray-200'}>{tok.text}</span>
              ))}
            </div>
          ))}
        </div>

        {/* Invisible textarea for editing */}
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={e => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyUp={handleCursor}
          onMouseUp={handleCursor}
          onClick={handleCursor}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full py-1 px-3 bg-transparent text-transparent caret-gray-200 font-mono text-[13px] leading-[20px] resize-none outline-none selection:bg-[#264f78]/70 selection:text-transparent overflow-auto scrollbar-os"
          spellCheck={false}
          wrap="off"
        />
      </div>

      {/* Minimap */}
      <Minimap lines={lines} scrollPercent={scrollPercent} />

      {/* Cursor position info passed to parent */}
      <input type="hidden" data-cursor-line={cursorLine} data-cursor-col={cursorCol} />
    </div>
  );
}

function TerminalPanel() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    '\x1b[32m➜\x1b[0m \x1b[36mmy-app\x1b[0m \x1b[33mgit:(main)\x1b[0m npm run dev',
    '',
    '  VITE v6.0.0  ready in 234 ms',
    '',
    '  ➜  Local:   http://localhost:5173/',
    '  ➜  Network: http://192.168.1.42:5173/',
    '  ➜  press h + enter to show help',
    '',
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setHistory(prev => [...prev, `$ ${input}`, `bash: ${input}: command executed`, '']);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] font-mono text-[13px]">
      <div className="flex items-center gap-2 px-3 py-1 border-b border-[#2b2b2b] bg-[#1e1e1e] shrink-0">
        <button className="text-[12px] text-white border-b-2 border-[#007acc] pb-0.5 px-1">TERMINAL</button>
        <button className="text-[12px] text-gray-500 hover:text-gray-300 pb-0.5 px-1">PROBLEMS</button>
        <button className="text-[12px] text-gray-500 hover:text-gray-300 pb-0.5 px-1">OUTPUT</button>
        <button className="text-[12px] text-gray-500 hover:text-gray-300 pb-0.5 px-1">DEBUG CONSOLE</button>
        <div className="flex-1" />
        <button className="p-0.5 hover:bg-[#383838] rounded text-gray-400"><Plus size={14} /></button>
        <button className="p-0.5 hover:bg-[#383838] rounded text-gray-400"><Trash2 size={14} /></button>
        <button className="p-0.5 hover:bg-[#383838] rounded text-gray-400"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-os p-2 text-gray-300">
        {history.map((line, i) => (
          <div key={i} className="leading-5 whitespace-pre">{line || '\u00A0'}</div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center leading-5">
          <span className="text-green-400 mr-1">$</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-200 caret-gray-200"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}

function StatusBar({ file, cursorLine, cursorCol }: { file: VFile | null; cursorLine: number; cursorCol: number }) {
  return (
    <div className="flex items-center h-[22px] bg-[#007acc] text-white text-[12px] px-2 shrink-0 select-none">
      <div className="flex items-center gap-3 flex-1">
        <span className="flex items-center gap-1"><GitBranch size={12} /> main</span>
        <span className="flex items-center gap-1"><RefreshCw size={10} /> 0</span>
        <span className="flex items-center gap-1 text-white/80">
          <AlertTriangle size={11} /> 0
          <Info size={11} /> 0
        </span>
      </div>
      <div className="flex items-center gap-3">
        {file && (
          <>
            <span>Ln {cursorLine}, Col {cursorCol}</span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span>{file.language}</span>
          </>
        )}
        <span className="flex items-center gap-1"><Check size={12} /> Prettier</span>
        <Bell size={12} className="ml-1" />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function CodeEditorApp() {
  const [files, setFiles] = useState(SAMPLE_FILES);
  const [tree, setTree] = useState(() => buildTree(SAMPLE_FILES));
  const [openTabs, setOpenTabs] = useState<string[]>([SAMPLE_FILES[0].path]);
  const [activeTab, setActiveTab] = useState(SAMPLE_FILES[0].path);
  const [sidebarPanel, setSidebarPanel] = useState('explorer');
  const [showTerminal, setShowTerminal] = useState(true);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [newItemState, setNewItemState] = useState<{ folderPath: string; type: 'file' | 'folder' } | null>(null);
  const [showFind, setShowFind] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const activeFile = files.find(f => f.path === activeTab) || null;

  const openFile = useCallback((file: VFile) => {
    setOpenTabs(prev => prev.includes(file.path) ? prev : [...prev, file.path]);
    setActiveTab(file.path);
  }, []);

  const closeTab = useCallback((path: string) => {
    setOpenTabs(prev => {
      const next = prev.filter(p => p !== path);
      if (activeTab === path) {
        setActiveTab(next[next.length - 1] || '');
      }
      return next;
    });
  }, [activeTab]);

  const toggleFolder = useCallback((path: string) => {
    const toggle = (node: VFolder): VFolder => ({
      ...node,
      expanded: node.path === path ? !node.expanded : node.expanded,
      children: node.children.map(c => isFolder(c) ? toggle(c) : c),
    });
    setTree(prev => toggle(prev));
  }, []);

  const updateFileContent = useCallback((content: string) => {
    setFiles(prev => prev.map(f => f.path === activeTab ? { ...f, content, isModified: true } : f));
  }, [activeTab]);

  const rebuildTree = useCallback((newFiles: VFile[]) => {
    setTree(buildTree(newFiles));
  }, []);

  const handleNewFile = useCallback((folderPath: string) => {
    setNewItemState({ folderPath, type: 'file' });
    // Expand the target folder
    const expand = (node: VFolder): VFolder => ({
      ...node,
      expanded: node.path === folderPath ? true : node.expanded,
      children: node.children.map(c => isFolder(c) ? expand(c) : c),
    });
    setTree(prev => expand(prev));
  }, []);

  const handleNewFolder = useCallback((folderPath: string) => {
    setNewItemState({ folderPath, type: 'folder' });
    const expand = (node: VFolder): VFolder => ({
      ...node,
      expanded: node.path === folderPath ? true : node.expanded,
      children: node.children.map(c => isFolder(c) ? expand(c) : c),
    });
    setTree(prev => expand(prev));
  }, []);

  const handleNewItemSubmit = useCallback((name: string) => {
    if (!newItemState) return;
    const parentPath = newItemState.folderPath === '/' ? '' : newItemState.folderPath;
    const newPath = `${parentPath}/${name}`;
    if (newItemState.type === 'file') {
      const newFile: VFile = { name, path: newPath, content: '', language: detectLang(name), isModified: false };
      setFiles(prev => {
        const next = [...prev, newFile];
        rebuildTree(next);
        return next;
      });
      setOpenTabs(prev => [...prev, newPath]);
      setActiveTab(newPath);
    } else {
      // Add empty folder to tree
      const addFolder = (node: VFolder): VFolder => {
        if (node.path === newItemState.folderPath) {
          const exists = node.children.some(c => isFolder(c) && c.name === name);
          if (exists) return node;
          return { ...node, children: [...node.children, { name, path: newPath, children: [], expanded: true } as VFolder] };
        }
        return { ...node, children: node.children.map(c => isFolder(c) ? addFolder(c) : c) };
      };
      setTree(prev => addFolder(prev));
    }
    setNewItemState(null);
  }, [newItemState, rebuildTree]);

  const handleNewItemCancel = useCallback(() => {
    setNewItemState(null);
  }, []);

  const handleDelete = useCallback((path: string) => {
    // Remove from files
    setFiles(prev => {
      const next = prev.filter(f => !f.path.startsWith(path));
      rebuildTree(next);
      return next;
    });
    // Remove from open tabs
    setOpenTabs(prev => {
      const next = prev.filter(p => !p.startsWith(path));
      if (activeTab.startsWith(path)) {
        setActiveTab(next[next.length - 1] || '');
      }
      return next;
    });
    // Also remove folders from tree that have no files
    const removeFromTree = (node: VFolder): VFolder => ({
      ...node,
      children: node.children
        .filter(c => {
          if (isFolder(c)) return c.path !== path;
          return (c as VFile).path !== path;
        })
        .map(c => isFolder(c) ? removeFromTree(c) : c),
    });
    setTree(prev => removeFromTree(prev));
  }, [activeTab, rebuildTree]);

  // Track cursor from CodeArea via DOM
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      const el = editorRef.current?.querySelector('input[data-cursor-line]') as HTMLInputElement;
      if (el) {
        setCursorLine(Number(el.dataset.cursorLine) || 1);
        setCursorCol(Number(el.dataset.cursorCol) || 1);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setFiles(prev => prev.map(f => f.path === activeTab ? { ...f, isModified: false } : f));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal(t => !t);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFind(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab]);

  const tabs = openTabs.map(p => files.find(f => f.path === p)!).filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-200 overflow-hidden" ref={editorRef}>
      {/* Titlebar */}
      <div className="flex items-center h-[30px] bg-[#323233] text-[12px] text-gray-300 px-3 select-none shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-blue-400 font-bold text-[14px]">⟨/⟩</span>
          <span className="text-gray-400">File</span>
          <span className="text-gray-400">Edit</span>
          <span className="text-gray-400">Selection</span>
          <span className="text-gray-400">View</span>
          <span className="text-gray-400">Go</span>
          <span className="text-gray-400">Run</span>
          <span className="text-gray-400">Terminal</span>
          <span className="text-gray-400">Help</span>
        </div>
        <span className="text-gray-400 text-[12px]">{activeFile?.name || 'Code Editor'} — my-app</span>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Activity bar */}
        <ActivityBar active={sidebarPanel} onSelect={setSidebarPanel} />

        {/* Sidebar */}
        {sidebarPanel && (
          <div className="w-[220px] shrink-0 border-r border-[#2b2b2b] overflow-hidden">
            <Sidebar tree={tree} onSelect={openFile} selectedPath={activeTab} onToggle={toggleFolder} sidebarPanel={sidebarPanel} onDelete={handleDelete} onNewFile={handleNewFile} onNewFolder={handleNewFolder} newItemState={newItemState} onNewItemSubmit={handleNewItemSubmit} onNewItemCancel={handleNewItemCancel} />
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {tabs.length > 0 ? (
            <>
              <EditorTabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} onClose={closeTab} />
              {activeFile && <Breadcrumbs path={activeFile.path} />}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#1e1e1e]">
                <div className={`flex-1 min-h-0 overflow-hidden ${showTerminal ? '' : ''}`}>
                  {activeFile && <CodeArea file={activeFile} onChange={updateFileContent} showFind={showFind} onCloseFind={() => setShowFind(false)} />}
                </div>
                {showTerminal && (
                  <div className="h-[180px] border-t border-[#2b2b2b] shrink-0">
                    <TerminalPanel />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4 opacity-20">⟨/⟩</div>
                <p className="text-[14px] mb-1">Visual Studio Code</p>
                <p className="text-[12px] text-gray-600">Open a file from the explorer to start editing</p>
                <div className="mt-6 text-[12px] text-gray-600 space-y-1">
                  <p><kbd className="px-1 py-0.5 bg-[#333] rounded text-gray-400">Ctrl+S</kbd> Save</p>
                  <p><kbd className="px-1 py-0.5 bg-[#333] rounded text-gray-400">Ctrl+`</kbd> Toggle Terminal</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar file={activeFile} cursorLine={cursorLine} cursorCol={cursorCol} />
    </div>
  );
}
