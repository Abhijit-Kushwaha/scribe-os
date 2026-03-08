import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useOS } from '../os/OSContext';

const rIP = () => `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*254+1)}`;
const rMAC = () => Array.from({length:6},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join('-');

export default function CmdApp() {
  const { getNode, writeFile, createFolder, deleteNode, fs } = useOS();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const cwdRef = useRef('C:\\Users\\Scribe');
  const lineRef = useRef('');
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef(-1);

  const cwd = () => cwdRef.current;
  const cwdFs = () => cwdRef.current.replace(/\\/g, '/');
  const setCwd = (p: string) => { cwdRef.current = p; };

  const writePrompt = useCallback(() => {
    const t = termRef.current;
    if (!t) return;
    t.write(`\r\n${cwd()}>`);
    lineRef.current = '';
  }, []);

  const processCommand = useCallback((cmd: string) => {
    const t = termRef.current;
    if (!t) return;
    if (!cmd.trim()) { writePrompt(); return; }

    historyRef.current.push(cmd);
    histIdxRef.current = -1;
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const w = (text: string) => t.write('\r\n' + text.replace(/\n/g, '\r\n'));

    switch (command) {
      case 'help':
        w('For a list of commands, type HELP.\n\ndir      Displays a list of files and subdirectories.\ncd       Displays or changes the current directory.\ncls      Clears the screen.\ncopy     Copies files.\ndel      Deletes files.\necho     Displays messages.\nexit     Quits CMD.\nfind     Searches for a text string.\nhostname Prints the computer name.\nipconfig Displays IP configuration.\nmkdir    Creates a directory.\nmove     Moves files.\nnetstat  Displays protocol statistics.\nping     Sends ICMP packets.\nren      Renames a file.\nrmdir    Removes a directory.\nset      Displays environment variables.\nsysteminfo Displays system information.\ntasklist Displays running processes.\ntaskkill Terminates a process.\ntree     Graphically displays folder structure.\ntype     Displays contents of a text file.\nver      Displays the Windows version.\nwhoami   Displays current user.');
        break;
      case 'cls':
        t.clear(); t.write('\x1b[H\x1b[2J'); writePrompt(); return;
      case 'ver':
        w('\nMicrosoft Windows [Version 10.0.22631.3007]\n(c) Microsoft Corporation. All rights reserved.'); break;
      case 'whoami':
        w('scribe\\admin'); break;
      case 'hostname':
        w('SCRIBE-PC'); break;
      case 'date':
        w(`The current date is: ${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })}`); break;
      case 'time':
        w(`The current time is: ${new Date().toLocaleTimeString()}`); break;
      case 'echo':
        w(args.join(' ')); break;
      case 'set':
        w('COMPUTERNAME=SCRIBE-PC\nHOMEDRIVE=C:\nHOMEPATH=\\Users\\Scribe\nOS=Windows_NT\nPATH=C:\\Windows\\system32;C:\\Windows;C:\\Program Files\nPROCESSOR_ARCHITECTURE=AMD64\nSYSTEMROOT=C:\\Windows\nUSERNAME=admin\nUSERPROFILE=C:\\Users\\Scribe'); break;
      case 'exit':
        w('Use the X button to close this window.'); break;

      case 'dir': {
        const target = args[0] ? `${cwdFs()}/${args[0]}` : cwdFs();
        const node = getNode(target);
        if (node?.children) {
          w(` Volume in drive C is ScribeOS\n Volume Serial Number is 4E2F-8A1D\n\n Directory of ${cwd()}${args[0] ? '\\' + args[0] : ''}\n`);
          const d = new Date();
          const ds = `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}  ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
          w(`${ds}    <DIR>          .`);
          w(`${ds}    <DIR>          ..`);
          let files = 0, dirs = 0, totalSize = 0;
          node.children.forEach(c => {
            if (c.type === 'folder') {
              dirs++;
              w(`${ds}    <DIR>          ${c.name}`);
            } else {
              files++;
              const sz = c.size || (c.content?.length || 0);
              totalSize += sz;
              w(`${ds}    ${String(sz).padStart(14)} ${c.name}`);
            }
          });
          w(`               ${files} File(s)    ${totalSize.toLocaleString()} bytes`);
          w(`               ${dirs} Dir(s)   51,200,000,000 bytes free`);
        } else w(`The system cannot find the path specified.`);
        break;
      }
      case 'cd': case 'chdir':
        if (!args[0]) { w(cwd()); break; }
        if (args[0] === '\\' || args[0] === '/') { setCwd('C:'); break; }
        if (args[0] === '..') {
          const p = cwd().split('\\');
          if (p.length > 1) setCwd(p.slice(0, -1).join('\\'));
          break;
        }
        { const target = `${cwdFs()}/${args[0]}`;
          const node = getNode(target);
          if (node?.type === 'folder') setCwd(`${cwd()}\\${args[0]}`);
          else w(`The system cannot find the path specified.`); }
        break;
      case 'type':
        if (!args[0]) { w('The syntax of the command is incorrect.'); break; }
        { const node = getNode(`${cwdFs()}/${args[0]}`);
          if (node?.type === 'file') w(node.content || '');
          else w(`The system cannot find the file specified.`); }
        break;
      case 'mkdir': case 'md':
        if (!args[0]) w('The syntax of the command is incorrect.');
        else { createFolder(cwdFs(), args[0]); w(`Directory created: ${args[0]}`); }
        break;
      case 'rmdir': case 'rd':
        if (!args[0]) w('The syntax of the command is incorrect.');
        else { deleteNode(`${cwdFs()}/${args[0]}`); w(`Directory removed.`); }
        break;
      case 'del': case 'erase':
        if (!args[0]) w('The syntax of the command is incorrect.');
        else { deleteNode(`${cwdFs()}/${args[0]}`); }
        break;
      case 'copy':
        if (args.length < 2) w('The syntax of the command is incorrect.');
        else w(`        1 file(s) copied.`);
        break;
      case 'move':
        if (args.length < 2) w('The syntax of the command is incorrect.');
        else w(`        1 file(s) moved.`);
        break;
      case 'ren': case 'rename':
        if (args.length < 2) w('The syntax of the command is incorrect.');
        else w(`File renamed.`);
        break;
      case 'tree': {
        const node = getNode(cwdFs());
        if (node?.children) {
          w(`Folder PATH listing for volume ScribeOS\nVolume serial number is 4E2F-8A1D`);
          w(`${cwd()}`);
          const printTree = (n: any, prefix: string, isLast: boolean) => {
            const folders = (n.children || []).filter((c: any) => c.type === 'folder');
            folders.forEach((f: any, i: number) => {
              const last = i === folders.length - 1;
              w(`${prefix}${last ? '└───' : '├───'}${f.name}`);
              printTree(f, prefix + (last ? '    ' : '│   '), last);
            });
          };
          printTree(node, '', false);
        }
        break;
      }

      case 'ipconfig':
        w(`\nWindows IP Configuration\n\n\nEthernet adapter Ethernet0:\n\n   Connection-specific DNS Suffix  . : scribe.local\n   Link-local IPv6 Address . . . . . : fe80::${Math.floor(Math.random()*9999)}:${Math.floor(Math.random()*9999)}%12\n   IPv4 Address. . . . . . . . . . . : 192.168.1.${Math.floor(Math.random()*200+10)}\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1`);
        break;
      case 'ping':
        if (!args[0]) { w('Usage: ping <hostname>'); break; }
        w(`\nPinging ${args[0]} [${rIP()}] with 32 bytes of data:`);
        for (let i = 0; i < 4; i++) w(`Reply from ${rIP()}: bytes=32 time=${Math.floor(Math.random()*40+5)}ms TTL=128`);
        w(`\nPing statistics for ${args[0]}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 5ms, Maximum = 42ms, Average = 18ms`);
        break;
      case 'netstat':
        w(`\nActive Connections\n\n  Proto  Local Address          Foreign Address        State\n  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING\n  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING\n  TCP    192.168.1.100:49234    ${rIP()}:443       ESTABLISHED\n  TCP    192.168.1.100:49235    ${rIP()}:443       ESTABLISHED\n  TCP    192.168.1.100:49240    ${rIP()}:80        TIME_WAIT`);
        break;
      case 'tracert':
        if (!args[0]) { w('Usage: tracert <hostname>'); break; }
        w(`\nTracing route to ${args[0]} over a maximum of 30 hops:\n`);
        for (let i = 0; i < Math.floor(Math.random()*6+4); i++)
          w(`  ${String(i+1).padStart(2)}    ${Math.floor(Math.random()*40+1)} ms    ${Math.floor(Math.random()*40+1)} ms    ${Math.floor(Math.random()*40+1)} ms  ${rIP()}`);
        w(`\nTrace complete.`);
        break;
      case 'nslookup':
        if (!args[0]) { w('Usage: nslookup <hostname>'); break; }
        w(`Server:  dns.google\nAddress:  8.8.8.8\n\nNon-authoritative answer:\nName:    ${args[0]}\nAddress:  ${rIP()}`);
        break;
      case 'arp':
        w(`\nInterface: 192.168.1.100 --- 0x12\n  Internet Address      Physical Address      Type\n  192.168.1.1           ${rMAC()}     dynamic\n  192.168.1.255         ff-ff-ff-ff-ff-ff     static`);
        break;

      case 'tasklist':
        w(`\nImage Name                     PID Session Name        Mem Usage\n========================= ======== ================ ============\nSystem Idle Process              0 Services                   8 K\nSystem                           4 Services               2,048 K\nsmss.exe                       412 Services               1,024 K\ncsrss.exe                      532 Console                4,096 K\nexplorer.exe                  3784 Console               64,512 K\nchrome.exe                    8234 Console              256,000 K\nscribe-os.exe                 9001 Console               32,768 K\ncmd.exe                      12045 Console                4,096 K`);
        break;
      case 'taskkill':
        if (!args[0]) w('ERROR: Invalid syntax.');
        else w(`SUCCESS: The process with PID ${args[args.indexOf('/PID')+1] || '0'} has been terminated.`);
        break;
      case 'systeminfo':
        w(`\nHost Name:                 SCRIBE-PC\nOS Name:                   Microsoft Windows 11 Pro\nOS Version:                10.0.22631 Build 22631\nSystem Manufacturer:       Scribe Technologies\nSystem Model:              Virtual Machine\nSystem Type:               x64-based PC\nProcessor(s):              ${navigator.hardwareConcurrency || 4} Processor(s) Installed.\nTotal Physical Memory:     8,192 MB\nAvailable Physical Memory: 4,096 MB\nNetwork Card(s):           1 NIC(s) Installed.\n                           [01]: Intel(R) Ethernet Connection`);
        break;
      case 'find':
        if (args.length < 2) w('FIND: Parameter format not correct');
        else w(`---------- ${args[args.length-1]}\nSearch complete.`);
        break;
      case 'color':
        w('Color attributes changed.'); break;
      case 'title':
        w('Title set.'); break;
      case 'powershell':
        w('Windows PowerShell\nCopyright (C) Microsoft Corporation.\n\nPS C:\\Users\\Scribe> (PowerShell sim not available — use CMD commands)'); break;

      default:
        w(`'${parts[0]}' is not recognized as an internal or external command,\noperable program or batch file.`);
    }
    writePrompt();
  }, [getNode, writeFile, createFolder, deleteNode, fs, writePrompt]);

  useEffect(() => {
    if (!containerRef.current || termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: "'Cascadia Mono', 'Consolas', 'Courier New', monospace",
      theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#cccccc',
        cursorAccent: '#0c0c0c',
        selectionBackground: '#264f78',
        black: '#0c0c0c',
        red: '#c50f1f',
        green: '#13a10e',
        yellow: '#c19c00',
        blue: '#0037da',
        magenta: '#881798',
        cyan: '#3a96dd',
        white: '#cccccc',
        brightBlack: '#767676',
        brightRed: '#e74856',
        brightGreen: '#16c60c',
        brightYellow: '#f9f1a5',
        brightBlue: '#3b78ff',
        brightMagenta: '#b4009e',
        brightCyan: '#61d6d6',
        brightWhite: '#f2f2f2',
      },
      scrollback: 5000,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    requestAnimationFrame(() => { try { fit.fit(); } catch {} });

    termRef.current = term;
    fitRef.current = fit;

    term.write('Microsoft Windows [Version 10.0.22631.3007]\r\n(c) Microsoft Corporation. All rights reserved.\r\n');
    writePrompt();

    term.onData(data => {
      if (data === '\r') {
        processCommand(lineRef.current);
        lineRef.current = '';
      } else if (data === '\x7f') {
        if (lineRef.current.length > 0) {
          lineRef.current = lineRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\x1b[A') {
        if (historyRef.current.length > 0) {
          const idx = histIdxRef.current === -1 ? historyRef.current.length - 1 : Math.max(0, histIdxRef.current - 1);
          histIdxRef.current = idx;
          term.write('\r\x1b[K' + cwd() + '>' + historyRef.current[idx]);
          lineRef.current = historyRef.current[idx];
        }
      } else if (data === '\x1b[B') {
        if (histIdxRef.current >= 0) {
          const idx = histIdxRef.current + 1;
          term.write('\r\x1b[K' + cwd() + '>');
          if (idx >= historyRef.current.length) {
            histIdxRef.current = -1;
            lineRef.current = '';
          } else {
            histIdxRef.current = idx;
            term.write(historyRef.current[idx]);
            lineRef.current = historyRef.current[idx];
          }
        }
      } else if (data === '\t') {
        const cmds = ['help','dir','cd','cls','copy','del','echo','exit','find','hostname','ipconfig','mkdir','move','netstat','nslookup','ping','ren','rmdir','set','systeminfo','tasklist','taskkill','time','tracert','tree','type','ver','whoami','color','title','powershell','arp','md','rd'];
        const match = cmds.filter(c => c.startsWith(lineRef.current.toLowerCase()));
        if (match.length === 1) {
          const remaining = match[0].slice(lineRef.current.length);
          lineRef.current = match[0];
          term.write(remaining);
        }
      } else if (data >= ' ') {
        lineRef.current += data;
        term.write(data);
      }
    });

    const ro = new ResizeObserver(() => { try { fit.fit(); } catch {} });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); term.dispose(); termRef.current = null; };
  }, [processCommand, writePrompt]);

  return <div ref={containerRef} className="h-full w-full" style={{ padding: '4px', background: '#0c0c0c' }} />;
}
