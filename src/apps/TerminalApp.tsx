import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../os/OSContext';

interface TermLine {
  type: 'input' | 'output' | 'error' | 'success' | 'warning';
  text: string;
}

const rIP = () => `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*254+1)}`;
const rMAC = () => Array.from({length:6},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':');
const rPort = () => Math.floor(Math.random()*60000+1024);
const rHash = (len=32) => Array.from({length:len},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
const sleep = (ms:number) => new Promise(r=>setTimeout(r,ms));

export default function TerminalApp() {
  const { fs, getNode, writeFile, createFolder, deleteNode } = useOS();
  const [lines, setLines] = useState<TermLine[]>([
    { type: 'output', text: '┌──────────────────────────────────────────┐' },
    { type: 'success', text: '│  Scribe OS Terminal v2.0 — Kali Edition  │' },
    { type: 'output', text: '└──────────────────────────────────────────┘' },
    { type: 'output', text: 'Type "help" for commands. Type "tools" for security tools.\n' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('C:/Users/Scribe');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  const out = (text: string, type: TermLine['type'] = 'output') =>
    setLines(prev => [...prev, { type, text }]);

  const outDelayed = async (msgs: {text:string,type?:TermLine['type'],delay?:number}[]) => {
    for (const m of msgs) {
      await sleep(m.delay || 80);
      setLines(prev => [...prev, { type: m.type || 'output', text: m.text }]);
    }
  };

  const processCommand = useCallback(async (cmd: string) => {
    setLines(prev => [...prev, { type: 'input', text: `┌──(scribe㉿scribe-os)-[${cwd}]\n└─$ ${cmd}` }]);
    setHistory(prev => [...prev, cmd]);
    setHistIdx(-1);
    setBusy(true);

    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);
    const flagSet = new Set(args.filter(a => a.startsWith('-')));
    const positional = args.filter(a => !a.startsWith('-'));

    try { switch (command) {
      case 'help':
        out(`\x1b[1mSYSTEM COMMANDS:\x1b[0m
  help            Show this help
  tools           List security/pentest tools
  dir / ls        List directory contents
  cd <path>       Change directory
  cat <file>      Show file contents
  echo <text>     Print text
  head <file>     Show first lines
  tail <file>     Show last lines
  grep <pat> <f>  Search in file
  wc <file>       Word/line count
  mkdir <name>    Create directory
  touch <name>    Create file
  rm <name>       Delete file/folder
  cp <src> <dst>  Copy file
  mv <src> <dst>  Move/rename file
  find <name>     Search for files
  clear / cls     Clear screen
  pwd             Working directory
  whoami          Current user
  id              User/group IDs
  hostname        System hostname
  uname [-a]      System info
  uptime          System uptime
  date            Date/time
  cal             Calendar
  env             Environment vars
  export K=V      Set env var
  alias           Show aliases
  history         Command history
  which <cmd>     Locate command
  man <cmd>       Manual page
  sudo <cmd>      Run as root
  su              Switch user
  chmod           Change permissions
  chown           Change owner
  df              Disk usage
  du              Directory size
  free            Memory usage
  top / htop      Process monitor
  ps              Process list
  kill <pid>      Kill process
  jobs            Background jobs
  wget <url>      Download file
  curl <url>      HTTP request
  ssh <host>      SSH connect
  scp             Secure copy
  netstat         Network stats
  ss              Socket stats
  ip addr         IP addresses
  ifconfig        Network config
  arp             ARP table
  route           Routing table
  traceroute      Trace route
  dig <domain>    DNS lookup
  nslookup        DNS query
  whois <domain>  WHOIS lookup
  ping <host>     Ping host
  neofetch        System display
  screenfetch     Alt system display
  base64          Encode/decode
  md5sum          MD5 hash
  sha256sum       SHA256 hash
  xxd             Hex dump`);
        break;

      case 'tools':
        out(`\x1b[1m╔══════════════════════════════════════════╗
║   SCRIBE OS — SECURITY TOOLKIT v2.0     ║
╚══════════════════════════════════════════╝\x1b[0m

\x1b[1mRECONNAISSANCE:\x1b[0m
  nmap <host>       Network port scanner
  nikto <host>      Web server scanner
  whois <domain>    Domain lookup
  dig <domain>      DNS enumeration
  traceroute <host> Route tracing
  dnsrecon <domain> DNS recon
  theharvester <d>  Email/subdomain harvester

\x1b[1mVULNERABILITY ANALYSIS:\x1b[0m
  sqlmap <url>      SQL injection scanner
  dirb <url>        Directory bruteforcer
  gobuster <url>    Directory/file scanner
  wpscan <url>      WordPress scanner
  searchsploit <q>  Exploit database search

\x1b[1mPASSWORD ATTACKS:\x1b[0m
  hydra <host>      Network login cracker
  john <file>       Password hash cracker
  hashcat <hash>    GPU hash cracker
  crunch            Wordlist generator

\x1b[1mWIRELESS:\x1b[0m
  airmon-ng         Monitor mode
  airodump-ng       Packet capture
  aircrack-ng       WPA/WPA2 cracker
  reaver            WPS attack

\x1b[1mEXPLOITATION:\x1b[0m
  msfconsole        Metasploit Framework
  msfvenom          Payload generator

\x1b[1mSNIFFING & SPOOFING:\x1b[0m
  wireshark         Network analyzer
  tcpdump           Packet capture
  ettercap          MITM framework
  arpspoof          ARP spoofing

\x1b[1mCRYPTO:\x1b[0m
  openssl           SSL/TLS toolkit
  gpg               GNU Privacy Guard
  base64            Encode/decode
  md5sum / sha256sum  Hash tools

⚠️  All tools run in simulated sandbox mode.`, 'success');
        break;

      case 'clear': case 'cls':
        setLines([]); break;
      case 'pwd':
        out(cwd); break;
      case 'whoami':
        out('root'); break;
      case 'id':
        out('uid=0(root) gid=0(root) groups=0(root),27(sudo),44(video),100(users)'); break;
      case 'hostname':
        out('scribe-os'); break;
      case 'date':
        out(new Date().toString()); break;
      case 'uname':
        if (flagSet.has('-a')) out('ScribeOS 6.1.0-kali9-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux');
        else out('ScribeOS'); break;
      case 'uptime':
        out(` ${new Date().toLocaleTimeString()} up ${Math.floor(performance.now()/60000)} min, 1 user, load average: ${(Math.random()*2).toFixed(2)}, ${(Math.random()*1.5).toFixed(2)}, ${(Math.random()).toFixed(2)}`); break;
      case 'echo':
        out(args.join(' ')); break;
      case 'cal': {
        const d = new Date(), m = d.getMonth(), y = d.getFullYear();
        const monthName = d.toLocaleString('default',{month:'long'});
        const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
        let cal = `     ${monthName} ${y}\nSu Mo Tu We Th Fr Sa\n`;
        cal += '   '.repeat(first);
        for (let i=1;i<=days;i++) {
          cal += (i===d.getDate()?`[${String(i).padStart(2)}]`:String(i).padStart(2)+' ');
          if((first+i)%7===0) cal+='\n';
        }
        out(cal); break;
      }
      case 'env':
        out(`PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOME=/root
USER=root
SHELL=/bin/bash
TERM=xterm-256color
LANG=en_US.UTF-8
DISPLAY=:0
SCRIBE_OS=2.0
HOSTNAME=scribe-os`); break;
      case 'free':
        out(`              total        used        free      shared  buff/cache   available
Mem:        8167940     3284156     1892784      456120     2991000     4103284
Swap:       2097148           0     2097148`); break;
      case 'df':
        out(`Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1       51200000 18432560  32767440  36% /
tmpfs            4083968        0   4083968   0% /dev/shm
/dev/sda2      102400000 42567892  59832108  42% /home`); break;
      case 'top': case 'htop':
        out(`top - ${new Date().toLocaleTimeString()} up ${Math.floor(performance.now()/60000)} min, load average: ${(Math.random()*2).toFixed(2)}
Tasks: 127 total,   2 running, 125 sleeping,   0 stopped,   0 zombie
%Cpu(s): ${(Math.random()*30+5).toFixed(1)} us, ${(Math.random()*10).toFixed(1)} sy, 0.0 ni, ${(Math.random()*50+40).toFixed(1)} id
MiB Mem :   7976.5 total,   1849.4 free,   3207.2 used,   2919.9 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM   COMMAND
    1 root      20   0  168940  13284   8456 S   0.0   0.2   systemd
  142 root      20   0   45268   5324   4588 S   0.3   0.1   scribe-wm
  287 root      20   0  724156  52348  36420 S   ${(Math.random()*15).toFixed(1)}   0.6   terminal
  412 root      20   0  345680  28456  18240 S   ${(Math.random()*8).toFixed(1)}   0.3   file-manager
  558 root      20   0 1245680 124568  82340 S   ${(Math.random()*20).toFixed(1)}   1.5   renderer
  693 root      20   0   89456  12340   8920 S   0.1   0.2   network-mgr`); break;
      case 'ps':
        out(`  PID TTY          TIME CMD
    1 ?        00:00:02 systemd
  142 ?        00:00:01 scribe-wm
  287 pts/0    00:00:00 bash
  412 pts/0    00:00:00 terminal
  558 ?        00:00:05 renderer
  693 ?        00:00:01 net-mgr
  ${Math.floor(Math.random()*9000+1000)} pts/0    00:00:00 ps`); break;
      case 'kill':
        if(!args[0]) out('Usage: kill <pid>','error');
        else out(`Process ${args[0]} terminated.`,'success'); break;
      case 'sudo':
        if(!args[0]) { out('Usage: sudo <command>','error'); break; }
        out('[sudo] password for root: ••••••••','warning');
        // re-run the sub-command
        break;
      case 'su':
        out('Already running as root.','warning'); break;
      case 'chmod':
        out(`mode of '${positional[1]||'file'}' changed`,'success'); break;
      case 'chown':
        out(`ownership of '${positional[1]||'file'}' changed`,'success'); break;

      // File operations
      case 'dir': case 'ls': {
        const lsPath = positional[0] ? `${cwd}/${positional[0]}` : cwd;
        const node = getNode(lsPath);
        if (node?.children) {
          if (flagSet.has('-la') || flagSet.has('-l') || flagSet.has('-al')) {
            out(`total ${node.children.length * 4}`);
            node.children.forEach(c => {
              const perm = c.type==='folder'?'drwxr-xr-x':'−rw-r--r--';
              const size = String(c.size||4096).padStart(6);
              out(`${perm} 1 root root ${size} Mar  8 00:00 ${c.name}${c.type==='folder'?'/':''}`);
            });
          } else {
            out(node.children.map(c=>`${c.type==='folder'?'📁':'📄'} ${c.name}${c.type==='folder'?'/':''}`).join('  ') || '(empty)');
          }
        } else out(`ls: cannot access '${lsPath}': No such directory`,'error');
        break;
      }
      case 'cd': {
        if (!args[0] || args[0]==='~') { setCwd('C:/Users/Scribe'); break; }
        if (args[0]==='..') { const p=cwd.split('/'); if(p.length>1) setCwd(p.slice(0,-1).join('/')); break; }
        if (args[0]==='/') { setCwd('C:'); break; }
        const target=`${cwd}/${args[0]}`;
        const node=getNode(target);
        if(node?.type==='folder') setCwd(target);
        else out(`cd: ${args[0]}: No such directory`,'error');
        break;
      }
      case 'cat': {
        if(!args[0]){out('Usage: cat <file>','error');break;}
        const node=getNode(`${cwd}/${args[0]}`);
        if(node?.type==='file') out(node.content||'');
        else out(`cat: ${args[0]}: No such file`,'error');
        break;
      }
      case 'head': {
        if(!args[0]){out('Usage: head <file>','error');break;}
        const node=getNode(`${cwd}/${args[0]}`);
        if(node?.type==='file') out((node.content||'').split('\n').slice(0,10).join('\n'));
        else out(`head: ${args[0]}: No such file`,'error');
        break;
      }
      case 'tail': {
        if(!args[0]){out('Usage: tail <file>','error');break;}
        const node=getNode(`${cwd}/${args[0]}`);
        if(node?.type==='file') out((node.content||'').split('\n').slice(-10).join('\n'));
        else out(`tail: ${args[0]}: No such file`,'error');
        break;
      }
      case 'grep': {
        if(args.length<2){out('Usage: grep <pattern> <file>','error');break;}
        const node=getNode(`${cwd}/${args[1]}`);
        if(node?.type==='file'){
          const matches=(node.content||'').split('\n').filter(l=>l.includes(args[0]));
          out(matches.length?matches.join('\n'):`No matches for '${args[0]}'`);
        } else out(`grep: ${args[1]}: No such file`,'error');
        break;
      }
      case 'wc': {
        if(!args[0]){out('Usage: wc <file>','error');break;}
        const node=getNode(`${cwd}/${args[0]}`);
        if(node?.type==='file'){
          const c=node.content||'';
          out(`  ${c.split('\n').length}  ${c.split(/\s+/).filter(Boolean).length}  ${c.length} ${args[0]}`);
        } else out(`wc: ${args[0]}: No such file`,'error');
        break;
      }
      case 'find': {
        if(!args[0]){out('Usage: find <name>','error');break;}
        const results: string[]=[];
        const search=(node:any,path:string)=>{
          if(node.name.includes(args[0])) results.push(path+'/'+node.name);
          node.children?.forEach((c:any)=>search(c,path+'/'+node.name));
        };
        search(fs,'');
        out(results.length?results.join('\n'):`No files matching '${args[0]}'`);
        break;
      }
      case 'mkdir':
        if(!args[0]) out('Usage: mkdir <name>','error');
        else { createFolder(cwd,args[0]); out(`Created: ${args[0]}`,'success'); }
        break;
      case 'touch':
        if(!args[0]) out('Usage: touch <name>','error');
        else { writeFile(`${cwd}/${args[0]}`,''); out(`Created: ${args[0]}`,'success'); }
        break;
      case 'rm':
        if(!args[0]) out('Usage: rm <name>','error');
        else { deleteNode(`${cwd}/${args[0]}`); out(`Removed: ${args[0]}`,'success'); }
        break;
      case 'cp':
        if(args.length<2) out('Usage: cp <src> <dst>','error');
        else out(`'${args[0]}' -> '${args[1]}'`,'success');
        break;
      case 'mv':
        if(args.length<2) out('Usage: mv <src> <dst>','error');
        else out(`renamed '${args[0]}' -> '${args[1]}'`,'success');
        break;

      // Network commands
      case 'ping': {
        if(!args[0]){out('Usage: ping <host>','error');break;}
        const ip=rIP();
        out(`PING ${args[0]} (${ip}) 56(84) bytes of data.`);
        await outDelayed(Array.from({length:4},(_,i)=>({
          text:`64 bytes from ${args[0]} (${ip}): icmp_seq=${i+1} ttl=64 time=${(Math.random()*40+5).toFixed(1)} ms`,
          delay:200
        })));
        out(`\n--- ${args[0]} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3004ms`);
        break;
      }
      case 'traceroute': {
        if(!args[0]){out('Usage: traceroute <host>','error');break;}
        out(`traceroute to ${args[0]}, 30 hops max, 60 byte packets`);
        const hops=Math.floor(Math.random()*8+5);
        await outDelayed(Array.from({length:hops},(_,i)=>({
          text:` ${String(i+1).padStart(2)}  ${i===hops-1?args[0]:rIP()}  ${(Math.random()*50+1).toFixed(3)} ms  ${(Math.random()*50+1).toFixed(3)} ms  ${(Math.random()*50+1).toFixed(3)} ms`,
          delay:150
        })));
        break;
      }
      case 'nmap': {
        const target = positional[0];
        if (!target) { out('Usage: nmap [-sV|-sS|-A|-p] <host>', 'error'); break; }
        out(`Starting Nmap 7.94SVN ( https://nmap.org ) at ${new Date().toISOString()}`, 'success');
        await outDelayed([
          { text: `NSE: Loaded 156 scripts for scanning.`, delay: 200 },
          { text: `Initiating Ping Scan at ${new Date().toLocaleTimeString()}`, delay: 300 },
          { text: `Scanning ${target} (${rIP()}) [4 ports]`, delay: 400 },
          { text: `Completed Ping Scan at ${new Date().toLocaleTimeString()}, 0.02s elapsed`, delay: 200 },
          { text: `Initiating SYN Stealth Scan at ${new Date().toLocaleTimeString()}`, delay: 300 },
        ]);
        const ports = [
          {p:21,s:'ftp',st:'closed',v:'vsftpd 3.0.5'},
          {p:22,s:'ssh',st:'open',v:'OpenSSH 9.2p1 Debian'},
          {p:25,s:'smtp',st:Math.random()>.5?'filtered':'closed',v:'Postfix smtpd'},
          {p:53,s:'domain',st:Math.random()>.3?'open':'filtered',v:'ISC BIND 9.18.16'},
          {p:80,s:'http',st:'open',v:'nginx 1.24.0'},
          {p:110,s:'pop3',st:'closed',v:'Dovecot pop3d'},
          {p:143,s:'imap',st:'closed',v:'Dovecot imapd'},
          {p:443,s:'https',st:'open',v:'nginx 1.24.0'},
          {p:993,s:'imaps',st:Math.random()>.5?'open':'closed',v:'Dovecot imapd'},
          {p:3306,s:'mysql',st:Math.random()>.5?'open':'filtered',v:'MySQL 8.0.33'},
          {p:5432,s:'postgresql',st:Math.random()>.6?'open':'closed',v:'PostgreSQL 15.3'},
          {p:6379,s:'redis',st:Math.random()>.7?'open':'filtered',v:'Redis 7.0.11'},
          {p:8080,s:'http-proxy',st:Math.random()>.5?'open':'closed',v:'Apache httpd 2.4.57'},
          {p:8443,s:'https-alt',st:Math.random()>.6?'open':'closed',v:''},
          {p:27017,s:'mongodb',st:Math.random()>.8?'open':'filtered',v:'MongoDB 6.0.8'},
        ];
        const open = ports.filter(p=>p.st!=='closed');
        await sleep(500);
        out(`\nPORT      STATE     SERVICE         VERSION`);
        for (const p of ports) {
          const line = `${String(p.p)+'/tcp'} ${' '.repeat(Math.max(1,6-String(p.p).length))}${p.st.padEnd(10)}${p.s.padEnd(16)}${flagSet.has('-sV')||flagSet.has('-A')?p.v:''}`;
          out(line);
        }
        if (flagSet.has('-A')) {
          out(`\nOS detection:\n  Running: Linux 5.x|6.x\n  OS CPE: cpe:/o:linux:linux_kernel:6\n  Aggressive OS guesses: Linux 6.1 (98%), Linux 5.15 (95%)`);
          out(`\nTraceroute:\nHOP RTT     ADDRESS\n1   0.42ms  gateway (192.168.1.1)\n2   12.8ms  ${rIP()}\n3   24.1ms  ${target} (${rIP()})`);
        }
        out(`\nNmap done: 1 IP address (1 host up) scanned in ${(Math.random()*15+5).toFixed(2)} seconds`, 'success');
        break;
      }
      case 'nikto': {
        const target=positional[0];
        if(!target){out('Usage: nikto -h <host>','error');break;}
        await outDelayed([
          {text:`- Nikto v2.5.0\n---------------------------------------------------------------------------`,type:'success' as const,delay:100},
          {text:`+ Target IP:          ${rIP()}`,delay:150},
          {text:`+ Target Hostname:    ${target}`,delay:100},
          {text:`+ Target Port:        80`,delay:100},
          {text:`+ Start Time:         ${new Date().toISOString()}`,delay:100},
          {text:`---------------------------------------------------------------------------`,delay:100},
          {text:`+ Server: nginx/1.24.0`,delay:300},
          {text:`+ /: The anti-clickjacking X-Frame-Options header is not present.`,type:'warning' as const,delay:200},
          {text:`+ /: The X-Content-Type-Options header is not set.`,type:'warning' as const,delay:200},
          {text:`+ /: Cookie session created without the httponly flag.`,type:'warning' as const,delay:250},
          {text:`+ Root page / redirects to: /index.html`,delay:200},
          {text:`+ /admin/: Directory indexing found.`,type:'error' as const,delay:300},
          {text:`+ /admin/config.php: PHP config file found.`,type:'error' as const,delay:200},
          {text:`+ /backup/: Backup directory found.`,type:'warning' as const,delay:250},
          {text:`+ /wp-login.php: WordPress login page found.`,delay:200},
          {text:`+ /.git/: Git repository found.`,type:'error' as const,delay:300},
          {text:`+ /server-status: Apache server-status accessible.`,type:'warning' as const,delay:200},
          {text:`+ ${Math.floor(Math.random()*20+8)} host(s) tested\n+ End Time: ${new Date().toISOString()}`,delay:100},
          {text:`---------------------------------------------------------------------------`,delay:50},
          {text:`+ ${Math.floor(Math.random()*15+5)} item(s) reported on remote host`,type:'success' as const,delay:100},
        ]);
        break;
      }
      case 'sqlmap': {
        const target=positional[0]||args.find(a=>a.startsWith('--url='))?.slice(6);
        if(!target){out('Usage: sqlmap -u <url> [--dbs] [--dump]','error');break;}
        await outDelayed([
          {text:`        ___\n       __H__\n ___ ___[']_____ ___ ___  {1.7.10#stable}\n|_ -| . [)]     | .'| . |\n|___|_  ["]_|_|_|__,|  _|\n      |_|V...       |_|   https://sqlmap.org\n`,type:'success' as const,delay:100},
          {text:`[*] starting @ ${new Date().toLocaleTimeString()}\n`,delay:200},
          {text:`[INFO] testing connection to the target URL`,delay:300},
          {text:`[INFO] checking if the target is protected by WAF/IPS`,delay:400},
          {text:`[INFO] testing if the target URL content is stable`,delay:300},
          {text:`[INFO] target URL content is stable`,type:'success' as const,delay:200},
          {text:`[INFO] testing if GET parameter 'id' is dynamic`,delay:400},
          {text:`[WARNING] GET parameter 'id' does not appear to be dynamic`,type:'warning' as const,delay:300},
          {text:`[INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable (possible DBMS: 'MySQL')`,type:'success' as const,delay:500},
          {text:`[INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'`,delay:400},
          {text:`[INFO] GET parameter 'id' appears to be 'AND boolean-based blind' injectable`,type:'success' as const,delay:300},
          {text:`[INFO] testing 'MySQL >= 5.0 AND error-based'`,delay:300},
          {text:`[INFO] GET parameter 'id' is 'MySQL >= 5.0 AND error-based' injectable`,type:'success' as const,delay:200},
          {text:`\nsqlmap identified the following injection point(s):\n---\nParameter: id (GET)\n    Type: boolean-based blind\n    Title: AND boolean-based blind\n    Payload: id=1 AND 5734=5734\n\n    Type: error-based\n    Title: MySQL >= 5.0 AND error-based\n    Payload: id=1 AND (SELECT 1234 FROM(SELECT COUNT(*),CONCAT(0x716b627871,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a)\n---`,type:'success' as const,delay:200},
          {text:`\n[INFO] the back-end DBMS is MySQL\nback-end DBMS: MySQL >= 5.0\n`,delay:200},
        ]);
        if(flagSet.has('--dbs')) {
          out(`available databases [5]:\n[*] information_schema\n[*] mysql\n[*] performance_schema\n[*] webapp_db\n[*] admin_panel`,'success');
        }
        break;
      }
      case 'hydra': {
        const target=positional[0];
        if(!target){out('Usage: hydra -l <user> -P <wordlist> <host> <service>','error');break;}
        await outDelayed([
          {text:`Hydra v9.5 (c) 2023 by van Hauser/THC - https://github.com/vanhauser-thc/thc-hydra`,type:'success' as const,delay:100},
          {text:`\n[DATA] max 16 tasks per 1 server, overall 16 tasks, 14344399 login tries`,delay:200},
          {text:`[DATA] attacking ssh://${target}:22/`,delay:200},
        ]);
        const attempts=Math.floor(Math.random()*10+5);
        for(let i=0;i<attempts;i++){
          await sleep(200);
          out(`[ATTEMPT] target ${target} - login: admin - pass: ${['password','123456','admin','root','letmein','qwerty','monkey','dragon'][i%8]} - ${i+1} of 14344399`);
        }
        await sleep(500);
        out(`[22][ssh] host: ${target}   login: admin   password: ${['P@ssw0rd!','Summer2026','Admin#123'][Math.floor(Math.random()*3)]}`,'success');
        out(`1 of 1 target successfully completed, 1 valid password found`,'success');
        break;
      }
      case 'john': {
        if(!args[0]){out('Usage: john <hashfile> [--wordlist=<file>]','error');break;}
        await outDelayed([
          {text:`Using default input encoding: UTF-8`,delay:100},
          {text:`Loaded ${Math.floor(Math.random()*5+1)} password hashes with ${Math.floor(Math.random()*3+1)} different salts (bcrypt [Blowfish 32/64])`,delay:200},
          {text:`Cost 1 (iteration count) is 1024 for all loaded hashes`,delay:100},
          {text:`Will run ${navigator.hardwareConcurrency||4} OpenMP threads`,delay:100},
          {text:`Press Ctrl-C to abort, or send SIGUSR1 for status`,delay:100},
        ]);
        for(let i=0;i<3;i++){
          await sleep(400);
          out(`${['password123','admin2026','s3cur1ty!'][i]}  (user${i+1})`,'success');
        }
        out(`\n${3} password hashes cracked, 0 left`,'success');
        break;
      }
      case 'hashcat': {
        if(!args[0]){out('Usage: hashcat -m <type> <hash> <wordlist>','error');break;}
        await outDelayed([
          {text:`hashcat (v6.2.6) starting\n`,type:'success' as const,delay:100},
          {text:`OpenCL API (OpenCL 3.0) - Platform #1 [WebGPU]\n* Device #1: Virtual GPU, 2048/4096 MB, ${navigator.hardwareConcurrency||4} compute units`,delay:200},
          {text:`\nDictionary cache built:\n* Filename..: rockyou.txt\n* Passwords.: 14344392\n* Bytes.....: 139921507`,delay:300},
          {text:`\n${rHash()}:${['password123','letmein','dragon123'][Math.floor(Math.random()*3)]}`,type:'success' as const,delay:500},
          {text:`\nSession..........: hashcat\nStatus...........: Cracked\nHash.Mode........: 0 (MD5)\nSpeed.#1.........: ${Math.floor(Math.random()*500+200)}${Math.random()>.5?' M':' K'}H/s\nRecovered........: 1/1 (100.00%) Digests`,type:'success' as const,delay:200},
        ]);
        break;
      }
      case 'dirb': case 'gobuster': {
        const target=positional[0];
        if(!target){out(`Usage: ${command} <url>`,'error');break;}
        out(`\n-----------------\n${command.toUpperCase()} v2.0\nBy OJ Reeves\n-----------------`,'success');
        out(`[+] Url:           ${target}\n[+] Wordlist:      /usr/share/wordlists/dirb/common.txt\n[+] Status codes:  200,204,301,302,307,401,403`);
        const dirs=['/admin','/api','/backup','/config','/css','/db','/docs','/images','/js','/login','/uploads','/wp-admin','/wp-content','/.git','/.env','/server-status','/phpmyadmin','/dashboard'];
        for(const d of dirs.slice(0,Math.floor(Math.random()*10+5))){
          await sleep(100);
          const code=[200,301,302,403][Math.floor(Math.random()*4)];
          out(`/${d.slice(1).padEnd(25)} (Status: ${code}) [Size: ${Math.floor(Math.random()*50000+100)}]`,code===200?'success':code===403?'warning':'output');
        }
        out(`\n${dirs.length} requests sent, ${Math.floor(Math.random()*10+3)} results found.`,'success');
        break;
      }
      case 'wpscan': {
        const target=positional[0];
        if(!target){out('Usage: wpscan --url <target>','error');break;}
        await outDelayed([
          {text:`_______________________________________________________________\n         __          _______   _____\n         \\ \\        / /  __ \\ / ____|\n          \\ \\  /\\  / /| |__) | (___   ___  __ _ _ __\n           \\ \\/  \\/ / |  ___/ \\___ \\ / __|/ _\` | '_ \\\n            \\  /\\  /  | |     ____) | (__| (_| | | | |\n             \\/  \\/   |_|    |_____/ \\___|\\__,_|_| |_|\n\n         WordPress Security Scanner by the WPScan Team`,type:'success' as const,delay:100},
          {text:`\n[+] URL: ${target}\n[+] Started: ${new Date().toISOString()}`,delay:200},
          {text:`\n[i] WordPress version 6.4.2 identified.`,delay:300},
          {text:`[!] 3 vulnerabilities identified:`,type:'warning' as const,delay:300},
          {text:`  | [!] Title: WordPress 6.4.x - SQL Injection\n  |     Fixed in: 6.4.3\n  |     Reference: https://wpscan.com/vulnerability/xxxxx`,type:'error' as const,delay:200},
          {text:`  | [!] Title: WordPress 6.4.x - XSS in Admin\n  |     Fixed in: 6.4.3`,type:'error' as const,delay:200},
          {text:`\n[+] WordPress theme in use: flavor\n | Version: 1.2.1\n | Found By: Css Style`,delay:200},
          {text:`\n[+] Enumerating plugins...\n | flavor-slider 2.1 (outdated)\n | contact-form-7 5.8.4\n | yoast-seo 21.6`,delay:300},
          {text:`\n[+] Finished: ${new Date().toISOString()}\n[+] Elapsed time: 00:00:${Math.floor(Math.random()*30+10)}`,type:'success' as const,delay:100},
        ]);
        break;
      }
      case 'searchsploit': {
        if(!args[0]){out('Usage: searchsploit <query>','error');break;}
        const q=args.join(' ');
        out(`\n${'-'.repeat(70)}\n Exploit Title                              |  Path\n${'-'.repeat(70)}`);
        const exploits=[
          [`${q} - Remote Code Execution`, `exploits/linux/remote/51234.py`],
          [`${q} - SQL Injection`, `exploits/php/webapps/49876.txt`],
          [`${q} - Buffer Overflow (DoS)`, `exploits/linux/dos/48234.c`],
          [`${q} - Privilege Escalation`, `exploits/linux/local/50123.sh`],
          [`${q} - Authentication Bypass`, `exploits/multiple/webapps/47890.py`],
        ];
        exploits.forEach(e=>out(`${e[0].padEnd(44)}| ${e[1]}`));
        out(`${'-'.repeat(70)}\nShellcodes: No results`);
        break;
      }

      // Wireless (simulated)
      case 'airmon-ng':
        out(`\nPHY\tInterface\tDriver\t\tChipset\nphy0\twlan0\t\tath9k_htc\tAtheros AR9271\n`);
        if(args[0]==='start') out(`\n(monitor mode enabled on wlan0mon)`,'success');
        break;
      case 'airodump-ng':
        out(`\n CH 6 ][ Elapsed: 12 s ][ ${new Date().toLocaleTimeString()}\n\n BSSID              PWR  Beacons  #Data  CH   ENC   ESSID\n ${rMAC()}  -42  47       324    6    WPA2  HomeNetwork-5G\n ${rMAC()}  -58  32       156    6    WPA2  TP-Link_${Math.floor(Math.random()*9999)}\n ${rMAC()}  -67  18       89     11   WPA2  NETGEAR${Math.floor(Math.random()*99)}\n ${rMAC()}  -73  12       45     1    WEP   linksys\n ${rMAC()}  -81  8        12     6    OPN   FreeWiFi`);
        break;
      case 'aircrack-ng':
        if(!args[0]){out('Usage: aircrack-ng <capture.cap>','error');break;}
        await outDelayed([
          {text:`Aircrack-ng 1.7\n\n[00:00:${String(Math.floor(Math.random()*59)).padStart(2,'0')}] ${Math.floor(Math.random()*50000+10000)} keys tested (${Math.floor(Math.random()*1000+500)}.42 k/s)\n`,delay:500},
          {text:`                KEY FOUND! [ ${Array.from({length:5},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':')} ]\n`,type:'success' as const,delay:800},
          {text:`Master Key     : ${rHash(64)}\nTransient Key  : ${rHash(64)}`,delay:100},
        ]);
        break;
      case 'reaver':
        out(`Reaver v1.6.6\n[+] Waiting for beacon from ${rMAC()}\n[+] WPS PIN: ${String(Math.floor(Math.random()*99999999)).padStart(8,'0')}\n[+] WPA PSK: '${['Summer2026!','MyWiFi#123','SecureNet$'][Math.floor(Math.random()*3)]}'\n[+] AP SSID: 'TargetNetwork'`,'success');
        break;

      // Metasploit
      case 'msfconsole':
        await outDelayed([
          {text:`\n       =[ metasploit v6.3.44-dev                          ]`,type:'success' as const,delay:200},
          {text:`+ -- --=[ 2345 exploits - 1234 auxiliary - 412 post       ]`,delay:100},
          {text:`+ -- --=[ 1287 payloads - 47 encoders - 11 nops           ]`,delay:100},
          {text:`+ -- --=[ 9 evasion                                       ]`,delay:100},
          {text:`\nMetasploit Documentation: https://docs.metasploit.com/\n`,delay:100},
          {text:`msf6 > Type 'help' for commands, 'search <term>' for modules.\n⚠️  Running in simulation mode — no real exploits executed.`,type:'warning' as const,delay:100},
        ]);
        break;
      case 'msfvenom':
        out(`[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload\n[-] No arch selected, selecting arch: x86\nNo encoder specified, outputting raw payload\nPayload size: ${Math.floor(Math.random()*400+200)} bytes\n\nSaved as: /tmp/payload.exe\n\n⚠️  Simulation only — no real payload generated.`,'warning');
        break;

      // Sniffing
      case 'wireshark':
        out(`Wireshark 4.0.10\n[INFO] Capturing on 'eth0'\nPackets captured: ${Math.floor(Math.random()*1000+100)}\n\n⚠️  GUI not available in terminal. Use tcpdump instead.`,'warning');
        break;
      case 'tcpdump':
        await outDelayed(Array.from({length:8},(_,i)=>({
          text:`${new Date().toLocaleTimeString()}.${String(Math.floor(Math.random()*999999)).padStart(6,'0')} IP ${rIP()}.${rPort()} > ${rIP()}.${[80,443,22,53][Math.floor(Math.random()*4)]}: Flags [${['S','S.','P.','F.'][Math.floor(Math.random()*4)]}], seq ${Math.floor(Math.random()*1000000)}, ack ${Math.floor(Math.random()*1000000)}, length ${Math.floor(Math.random()*1500)}`,
          delay:150
        })));
        out(`\n8 packets captured\n8 packets received by filter`);
        break;
      case 'ettercap':
        out(`ettercap 0.8.3.1\n\nListening on eth0... (Ethernet)\n  ${rMAC()} ${rIP()}\n\nStarting Unified sniffing...\n⚠️  Simulation mode — no actual MITM performed.`,'warning');
        break;
      case 'arpspoof':
        out(`${rMAC()} ${rIP()} ${rMAC()}\n⚠️  ARP spoofing simulated — no packets sent.`,'warning');
        break;

      // Network
      case 'ifconfig': case 'ip':
        out(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet ${rIP()}  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::${rHash(4)}:${rHash(4)}:${rHash(4)}:${rHash(4)}  prefixlen 64
        ether ${rMAC()}  txqueuelen 1000
        RX packets ${Math.floor(Math.random()*100000)}  bytes ${Math.floor(Math.random()*500000000)}
        TX packets ${Math.floor(Math.random()*80000)}  bytes ${Math.floor(Math.random()*300000000)}

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128`);
        break;
      case 'netstat': case 'ss':
        out(`Active Internet connections\nProto Recv-Q Send-Q Local Address          Foreign Address        State
tcp        0      0 0.0.0.0:22             0.0.0.0:*              LISTEN
tcp        0      0 0.0.0.0:80             0.0.0.0:*              LISTEN
tcp        0      0 0.0.0.0:443            0.0.0.0:*              LISTEN
tcp        0    248 ${rIP()}:22        ${rIP()}:${rPort()}   ESTABLISHED
tcp        0      0 ${rIP()}:443       ${rIP()}:${rPort()}   TIME_WAIT
udp        0      0 0.0.0.0:68             0.0.0.0:*              `);
        break;
      case 'arp':
        out(`Address         HWtype  HWaddress           Flags
192.168.1.1     ether   ${rMAC()}   C
192.168.1.${Math.floor(Math.random()*254+2)}   ether   ${rMAC()}   C
192.168.1.${Math.floor(Math.random()*254+2)}   ether   ${rMAC()}   C`);
        break;
      case 'route':
        out(`Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0
192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0`);
        break;
      case 'dig': case 'nslookup': {
        const domain=positional[0]||'example.com';
        out(`;; ANSWER SECTION:\n${domain}.\t\t300\tIN\tA\t${rIP()}\n${domain}.\t\t300\tIN\tAAAA\t2606:4700::${rHash(4)}:${rHash(4)}\n${domain}.\t\t3600\tIN\tMX\t10 mail.${domain}.\n${domain}.\t\t3600\tIN\tNS\tns1.${domain}.\n${domain}.\t\t3600\tIN\tNS\tns2.${domain}.\n\n;; Query time: ${Math.floor(Math.random()*50+5)} msec\n;; SERVER: 8.8.8.8#53`);
        break;
      }
      case 'whois': {
        const domain=positional[0]||'example.com';
        out(`Domain Name: ${domain.toUpperCase()}\nRegistrar: NameCheap, Inc.\nCreation Date: 2019-03-15T12:00:00Z\nExpiry Date: 2027-03-15T12:00:00Z\nRegistrant: REDACTED FOR PRIVACY\nName Server: ns1.cloudflare.com\nName Server: ns2.cloudflare.com\nDNSSEC: unsigned\nStatus: clientTransferProhibited`);
        break;
      }
      case 'dnsrecon': {
        const domain=positional[0]||'example.com';
        out(`[*] Performing General Enumeration of Domain: ${domain}`,'success');
        await outDelayed([
          {text:`[*] DNSSEC is not configured for ${domain}`,type:'warning' as const,delay:200},
          {text:`[*] A ${domain} ${rIP()}`,delay:150},
          {text:`[*] AAAA ${domain} 2606:4700::${rHash(4)}`,delay:150},
          {text:`[*] MX mail.${domain} ${rIP()}`,delay:150},
          {text:`[*] NS ns1.${domain} ${rIP()}`,delay:150},
          {text:`[*] NS ns2.${domain} ${rIP()}`,delay:150},
          {text:`[*] TXT ${domain} "v=spf1 include:_spf.google.com ~all"`,delay:150},
          {text:`[*] SOA ns1.${domain} admin.${domain}`,delay:150},
          {text:`[+] ${Math.floor(Math.random()*10+5)} Records Found`,type:'success' as const,delay:100},
        ]);
        break;
      }
      case 'theharvester': {
        const domain=positional[0]||'example.com';
        await outDelayed([
          {text:`*******************************************************************\n*  _   _                                            _             *\n* | |_| |__   ___    /\\  /\\__ _ _ ____   _____  ___| |_ ___ _ __  *\n* | __| '_ \\ / _ \\  / /_/ / _\` | '__\\ \\ / / _ \\/ __| __/ _ \\ '__| *\n* | |_| | | |  __/ / __  / (_| | |   \\ V /  __/\\__ \\ ||  __/ |    *\n*  \\__|_| |_|\\___| \\/ /_/ \\__,_|_|    \\_/ \\___||___/\\__\\___|_|    *\n*                                                                 *\n*******************************************************************`,type:'success' as const,delay:100},
          {text:`\n[*] Target: ${domain}\n[*] Searching: Google, Bing, LinkedIn, Twitter\n`,delay:300},
          {text:`[*] Emails found: ${Math.floor(Math.random()*10+3)}`,type:'success' as const,delay:400},
          ...[...Array(Math.floor(Math.random()*5+2))].map(()=>({text:` - ${['admin','info','support','contact','dev'][Math.floor(Math.random()*5)]}@${domain}`,delay:100})),
          {text:`\n[*] Hosts found: ${Math.floor(Math.random()*8+3)}`,type:'success' as const,delay:300},
          ...[...Array(Math.floor(Math.random()*4+2))].map(()=>({text:` - ${['www','mail','api','dev','staging','cdn'][Math.floor(Math.random()*6)]}.${domain}: ${rIP()}`,delay:100})),
        ]);
        break;
      }

      // Crypto / Utils
      case 'openssl':
        out(`OpenSSL 3.1.4 24 Oct 2023 (Library: OpenSSL 3.1.4)\nbuilt on: reproducible build, date unspecified\nCompiler: gcc -fPIC -pthread -m64`);
        break;
      case 'base64':
        if(args[0]) out(btoa(args.join(' ')));
        else out('Usage: base64 <text>','error');
        break;
      case 'md5sum':
        out(`${rHash(32)}  ${args[0]||'stdin'}`);
        break;
      case 'sha256sum':
        out(`${rHash(64)}  ${args[0]||'stdin'}`);
        break;
      case 'xxd': {
        const text=args.join(' ')||'Hello';
        const hex=Array.from(text).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
        out(`00000000: ${hex}  ${text}`);
        break;
      }
      case 'wget': case 'curl':
        if(!args[0]){out(`Usage: ${command} <url>`,'error');break;}
        out(`--${new Date().toISOString()}--  ${args[0]}\nResolving ${args[0]}... ${rIP()}\nConnecting to ${args[0]}|${rIP()}|:443... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: ${Math.floor(Math.random()*50000+1000)} (${Math.floor(Math.random()*50+1)}K) [text/html]\nSaving to: 'index.html'\n\nindex.html       100%[============>] ${Math.floor(Math.random()*50+1)}K  --.-KB/s    in 0.${Math.floor(Math.random()*9)}s\n\n${new Date().toISOString()} - 'index.html' saved`,'success');
        break;
      case 'ssh':
        if(!args[0]){out('Usage: ssh <user@host>','error');break;}
        out(`The authenticity of host '${args[0]}' can't be established.\nED25519 key fingerprint is SHA256:${rHash(43)}.\nThis key is not known.\n\n⚠️  SSH connections are simulated in Scribe OS.`,'warning');
        break;
      case 'scp':
        out('⚠️  SCP is simulated — no real file transfer.','warning');
        break;
      case 'which':
        if(!args[0]) out('Usage: which <command>','error');
        else out(`/usr/bin/${args[0]}`);
        break;
      case 'man':
        if(!args[0]) out('What manual page do you want?','error');
        else out(`${(args[0]||'').toUpperCase()}(1)\t\tScribe OS Manual\n\nNAME\n\t${args[0]} - ${args[0]} command utility\n\nSYNOPSIS\n\t${args[0]} [OPTIONS] [ARGS]\n\nDESCRIPTION\n\tSimulated manual page for ${args[0]}.\n\tRun '${args[0]} --help' for usage information.`);
        break;
      case 'export':
        out(`Environment variable set.`,'success'); break;
      case 'alias':
        out(`alias ll='ls -la'\nalias la='ls -A'\nalias grep='grep --color=auto'`); break;
      case 'neofetch': case 'screenfetch':
        out(`
   ╔══════════════════╗     scribe@scribe-os
   ║   ██████╗ ██████╗║     ──────────────────────
   ║  ██╔════╝██╔═══╝║     OS: Scribe OS 2.0 Kali Edition
   ║  ╚█████╗ ██║    ║     Host: Browser Runtime (WASM)
   ║   ╚═══██╗██║    ║     Kernel: 6.1.0-kali9-amd64
   ║  ██████╔╝╚█████╗║     Uptime: ${Math.floor(performance.now()/60000)} mins
   ║  ╚═════╝  ╚════╝║     Shell: scribe-sh 2.0
   ╚══════════════════╝     Resolution: ${window.innerWidth}x${window.innerHeight}
                            DE: Scribe Desktop Environment
   ████████████████████     WM: scribe-wm
   ████████████████████     Terminal: Scribe Terminal v2
                            CPU: WebAssembly vCPU (${navigator.hardwareConcurrency||4}) @ 3.6GHz
                            GPU: WebGPU Virtual Adapter
                            Memory: ${Math.round(((performance as any).memory?.usedJSHeapSize || 134217728) / 1024 / 1024)}MiB / ${Math.round(((performance as any).memory?.totalJSHeapSize || 536870912) / 1024 / 1024)}MiB`);
        break;
      case 'du':
        out(`4.0K\t./Documents\n8.0K\t./Desktop\n12K\t./Downloads\n2.0K\t./Pictures\n26K\t.`);
        break;
      case 'jobs':
        out(`[1]+  Running                 nmap -sV target &`);
        break;
      case 'crunch':
        out(`Crunch will now generate the following number of lines: ${Math.floor(Math.random()*1000000+100000)}\ncrunch: 100% completed generating output\n⚠️  Wordlist generation simulated.`,'warning');
        break;
      case 'gpg':
        out(`gpg (GnuPG) 2.2.40\nlibgcrypt 1.10.1\nCopyright (C) 2022 g10 Code GmbH`);
        break;

      case 'history':
        out(history.map((h,i)=>`  ${String(i+1).padStart(4)}  ${h}`).join('\n'));
        break;
      case '':
        break;
      default:
        out(`bash: ${command}: command not found. Try 'help' or 'tools'.`,'error');
    }} catch(e) { out(`Error: ${e}`,'error'); }
    setBusy(false);
  }, [cwd, history, getNode, writeFile, createFolder, deleteNode, fs]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (busy) return;
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
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // simple autocomplete
      const cmds = ['help','tools','ls','dir','cd','cat','echo','mkdir','touch','rm','clear','cls','pwd','whoami','id','hostname','uname','uptime','date','cal','env','history','ping','nmap','nikto','sqlmap','hydra','john','hashcat','dirb','gobuster','wpscan','searchsploit','airmon-ng','airodump-ng','aircrack-ng','reaver','msfconsole','msfvenom','wireshark','tcpdump','ettercap','arpspoof','ifconfig','netstat','ss','arp','route','traceroute','dig','nslookup','whois','dnsrecon','theharvester','wget','curl','ssh','neofetch','screenfetch','top','htop','ps','kill','free','df','du','find','grep','head','tail','wc','base64','md5sum','sha256sum','xxd','openssl','man','which','sudo'];
      const match = cmds.filter(c => c.startsWith(input.toLowerCase()));
      if (match.length === 1) setInput(match[0]);
      else if (match.length > 1) out(match.join('  '));
    }
  };

  const lineColor = (type: TermLine['type']) => {
    switch(type) {
      case 'input': return 'text-os-terminal-cyan';
      case 'success': return 'text-os-terminal-green';
      case 'error': return 'text-destructive';
      case 'warning': return 'text-yellow-400';
      default: return 'text-foreground/80';
    }
  };

  return (
    <div
      className="h-full bg-os-terminal-bg p-3 font-mono text-xs overflow-y-auto scrollbar-os cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((line, i) => (
        <div key={i} className={`whitespace-pre-wrap mb-0.5 ${lineColor(line.type)}`}>
          {line.text}
        </div>
      ))}
      {!busy && (
        <div className="flex items-start text-os-terminal-cyan">
          <span className="whitespace-pre">┌──(scribe㉿scribe-os)-[{cwd}]{'\n'}└─$ </span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent outline-none text-os-terminal-green caret-primary mt-5"
            autoFocus
            spellCheck={false}
          />
        </div>
      )}
      {busy && <div className="text-primary animate-blink">⣿ Processing...</div>}
      <div ref={endRef} />
    </div>
  );
}
