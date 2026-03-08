import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../os/OSContext';

interface TermLine {
  type: 'input' | 'output';
  text: string;
}

export default function TerminalApp() {
  const { fs, getNode, writeFile, createFolder, deleteNode } = useOS();
  const [lines, setLines] = useState<TermLine[]>([
    { type: 'output', text: 'Scribe OS Terminal v1.0' },
    { type: 'output', text: 'Type "help" for available commands.\n' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('C:/Users/Scribe');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  const addOutput = (text: string) => setLines(prev => [...prev, { type: 'output', text }]);

  const processCommand = useCallback((cmd: string) => {
    setLines(prev => [...prev, { type: 'input', text: `${cwd}> ${cmd}` }]);
    setHistory(prev => [...prev, cmd]);
    setHistIdx(-1);

    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        addOutput(`Available commands:
  help          - Show this help
  dir / ls      - List directory contents
  cd <path>     - Change directory
  cat <file>    - Show file contents
  echo <text>   - Print text
  mkdir <name>  - Create directory
  touch <name>  - Create empty file
  rm <name>     - Delete file/folder
  clear / cls   - Clear screen
  pwd           - Print working directory
  whoami        - Current user
  date          - Show date/time
  uname         - System info
  neofetch      - System info display
  ping <host>   - Simulate ping
  nmap <host>   - Simulate port scan
  ifconfig      - Show network config
  history       - Command history`);
        break;
      case 'clear': case 'cls':
        setLines([]);
        break;
      case 'pwd':
        addOutput(cwd);
        break;
      case 'whoami':
        addOutput('scribe@scribe-os');
        break;
      case 'date':
        addOutput(new Date().toString());
        break;
      case 'uname':
        addOutput('ScribeOS 1.0.0 Browser/WASM x86_64');
        break;
      case 'echo':
        addOutput(args.join(' '));
        break;
      case 'neofetch':
        addOutput(`
   ╔═══════════╗     scribe@scribe-os
   ║  SCRIBE   ║     ─────────────────
   ║    OS     ║     OS: Scribe OS 1.0
   ║  ░░░░░░  ║     Host: Browser Runtime
   ║  ░░░░░░  ║     Kernel: WASM-virt
   ╚═══════════╝     Shell: scribe-sh 1.0
                      Resolution: ${window.innerWidth}x${window.innerHeight}
                      Terminal: Scribe Terminal
                      CPU: WebAssembly vCPU
                      Memory: ${Math.round(((performance as any).memory?.usedJSHeapSize || 134217728) / 1024 / 1024)}MB / ${Math.round(((performance as any).memory?.totalJSHeapSize || 536870912) / 1024 / 1024)}MB`);
        break;
      case 'dir': case 'ls': {
        const node = getNode(cwd);
        if (node?.children) {
          const listing = node.children.map(c =>
            `${c.type === 'folder' ? '📁' : '📄'} ${c.name}${c.type === 'folder' ? '/' : `  (${c.size || 0}B)`}`
          ).join('\n');
          addOutput(listing || '(empty directory)');
        } else addOutput('Cannot read directory');
        break;
      }
      case 'cd': {
        if (!args[0] || args[0] === '~') { setCwd('C:/Users/Scribe'); break; }
        if (args[0] === '..') {
          const parts = cwd.split('/');
          if (parts.length > 1) setCwd(parts.slice(0, -1).join('/'));
          break;
        }
        const target = `${cwd}/${args[0]}`;
        const node = getNode(target);
        if (node?.type === 'folder') setCwd(target);
        else addOutput(`cd: no such directory: ${args[0]}`);
        break;
      }
      case 'cat': {
        if (!args[0]) { addOutput('Usage: cat <filename>'); break; }
        const node = getNode(`${cwd}/${args[0]}`);
        if (node?.type === 'file') addOutput(node.content || '');
        else addOutput(`cat: ${args[0]}: No such file`);
        break;
      }
      case 'mkdir':
        if (!args[0]) addOutput('Usage: mkdir <name>');
        else { createFolder(cwd, args[0]); addOutput(`Created directory: ${args[0]}`); }
        break;
      case 'touch':
        if (!args[0]) addOutput('Usage: touch <name>');
        else { writeFile(`${cwd}/${args[0]}`, ''); addOutput(`Created file: ${args[0]}`); }
        break;
      case 'rm':
        if (!args[0]) addOutput('Usage: rm <name>');
        else { deleteNode(`${cwd}/${args[0]}`); addOutput(`Removed: ${args[0]}`); }
        break;
      case 'history':
        addOutput(history.map((h, i) => `  ${i + 1}  ${h}`).join('\n'));
        break;
      case 'ping': {
        if (!args[0]) { addOutput('Usage: ping <host>'); break; }
        addOutput(`PING ${args[0]} (${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}): 56 data bytes`);
        for (let i = 0; i < 4; i++) {
          const ms = (Math.random() * 40 + 10).toFixed(1);
          addOutput(`64 bytes from ${args[0]}: icmp_seq=${i} ttl=64 time=${ms} ms`);
        }
        addOutput(`--- ${args[0]} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`);
        break;
      }
      case 'nmap': {
        if (!args[0]) { addOutput('Usage: nmap <host>'); break; }
        addOutput(`Starting Nmap 7.94 ( https://nmap.org )\nScanning ${args[0]}...`);
        const ports = [
          { port: 22, service: 'ssh', state: 'open' },
          { port: 80, service: 'http', state: 'open' },
          { port: 443, service: 'https', state: 'open' },
          { port: 3306, service: 'mysql', state: Math.random() > 0.5 ? 'open' : 'filtered' },
          { port: 8080, service: 'http-proxy', state: Math.random() > 0.5 ? 'open' : 'closed' },
        ];
        addOutput('PORT     STATE     SERVICE');
        ports.forEach(p => addOutput(`${String(p.port).padEnd(8)} ${p.state.padEnd(9)} ${p.service}`));
        addOutput(`\nNmap done: 1 IP address (1 host up) scanned in ${(Math.random()*5+2).toFixed(2)} seconds`);
        break;
      }
      case 'ifconfig':
        addOutput(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>
        inet 192.168.1.${Math.floor(Math.random()*254+1)}  netmask 255.255.255.0
        inet6 fe80::1  prefixlen 64
        ether 00:0a:95:9d:68:${Math.floor(Math.random()*99).toString().padStart(2,'0')}
        RX packets: ${Math.floor(Math.random()*100000)}  bytes: ${Math.floor(Math.random()*50000000)}
        TX packets: ${Math.floor(Math.random()*80000)}  bytes: ${Math.floor(Math.random()*30000000)}`);
        break;
      case '':
        break;
      default:
        addOutput(`'${command}' is not recognized. Type 'help' for commands.`);
    }
  }, [cwd, history, getNode, writeFile, createFolder, deleteNode]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      processCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx >= 0) {
        const idx = histIdx + 1;
        if (idx >= history.length) { setHistIdx(-1); setInput(''); }
        else { setHistIdx(idx); setInput(history[idx]); }
      }
    }
  };

  return (
    <div
      className="h-full bg-os-terminal-bg p-3 font-mono text-xs overflow-y-auto scrollbar-os cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((line, i) => (
        <div key={i} className={`whitespace-pre-wrap mb-0.5 ${line.type === 'input' ? 'text-os-terminal-cyan' : 'text-os-terminal-green'}`}>
          {line.text}
        </div>
      ))}
      <div className="flex items-center text-os-terminal-cyan">
        <span>{cwd}&gt;&nbsp;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent outline-none text-os-terminal-green caret-primary"
          autoFocus
          spellCheck={false}
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}
