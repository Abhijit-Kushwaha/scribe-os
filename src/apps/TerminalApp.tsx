import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useOS } from '../os/OSContext';
const BACKEND_WS = "wss://scribe-os-production.up.railway.app";

const rIP = () => `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*254+1)}`;
const rMAC = () => Array.from({length:6},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':');
const rHash = (len=32) => Array.from({length:len},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');

export default function TerminalApp() {
  const { getNode, writeFile, createFolder, deleteNode, fs } = useOS();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const cwdRef = useRef('C:/Users/Scribe');
  const lineRef = useRef('');
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef(-1);

  const cwd = () => cwdRef.current;
  const setCwd = (p: string) => { cwdRef.current = p; };

  const writePrompt = useCallback(() => {
    const t = termRef.current;
    if (!t) return;
    t.write(`\r\n\x1b[1;36m┌──(\x1b[1;31mscribe㉿scribe-os\x1b[1;36m)-[\x1b[0;1m${cwd()}\x1b[1;36m]\r\n└─\x1b[1;31m$\x1b[0m `);
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
    const flags = new Set(args.filter(a => a.startsWith('-')));
    const pos = args.filter(a => !a.startsWith('-'));

    const w = (text: string) => t.write('\r\n' + text.replace(/\n/g, '\r\n'));
    const wg = (text: string) => t.write('\r\n\x1b[32m' + text.replace(/\n/g, '\r\n') + '\x1b[0m');
    const wr = (text: string) => t.write('\r\n\x1b[31m' + text.replace(/\n/g, '\r\n') + '\x1b[0m');
    const wy = (text: string) => t.write('\r\n\x1b[33m' + text.replace(/\n/g, '\r\n') + '\x1b[0m');
    const wc = (text: string) => t.write('\r\n\x1b[36m' + text.replace(/\n/g, '\r\n') + '\x1b[0m');

    switch (command) {
      case 'help':
        w(`\x1b[1mSYSTEM:\x1b[0m ls dir cd cat echo mkdir touch rm cp mv pwd whoami id
       hostname uname uptime date cal env history clear cls find
       grep head tail wc df du free top htop ps kill which man sudo
\x1b[1mNETWORK:\x1b[0m ping traceroute ifconfig ip netstat ss arp route
         dig nslookup whois wget curl ssh
\x1b[1mSECURITY:\x1b[0m nmap nikto sqlmap hydra john hashcat dirb gobuster
          wpscan searchsploit msfconsole msfvenom airmon-ng
          airodump-ng aircrack-ng reaver wireshark tcpdump
          ettercap arpspoof dnsrecon theharvester crunch
\x1b[1mUTILS:\x1b[0m base64 md5sum sha256sum xxd openssl gpg neofetch`);
        break;
      case 'tools':
        wc(`╔══════════════════════════════════════════╗
║   SCRIBE OS — SECURITY TOOLKIT v2.0     ║
╚══════════════════════════════════════════╝`);
        w(`\n\x1b[1mRECON:\x1b[0m nmap nikto whois dig traceroute dnsrecon theharvester
\x1b[1mVULN:\x1b[0m  sqlmap dirb gobuster wpscan searchsploit
\x1b[1mPASS:\x1b[0m  hydra john hashcat crunch
\x1b[1mWIFI:\x1b[0m  airmon-ng airodump-ng aircrack-ng reaver
\x1b[1mEXPL:\x1b[0m  msfconsole msfvenom
\x1b[1mSNIFF:\x1b[0m wireshark tcpdump ettercap arpspoof`);
        break;
      case 'clear': case 'cls':
        t.clear(); t.write('\x1b[H\x1b[2J'); writePrompt(); return;
      case 'pwd': w(cwd()); break;
      case 'whoami': wg('root'); break;
      case 'id': w('uid=0(root) gid=0(root) groups=0(root),27(sudo)'); break;
      case 'hostname': w('scribe-os'); break;
      case 'date': w(new Date().toString()); break;
      case 'uname':
        w(flags.has('-a') ? 'ScribeOS 6.1.0-kali9-amd64 #1 SMP x86_64 GNU/Linux' : 'ScribeOS'); break;
      case 'uptime':
        w(` ${new Date().toLocaleTimeString()} up ${Math.floor(performance.now()/60000)} min, load: ${(Math.random()*2).toFixed(2)}`); break;
      case 'echo': w(args.join(' ')); break;
      case 'cal': {
        const d = new Date(), m = d.getMonth(), y = d.getFullYear();
        const mn = d.toLocaleString('default',{month:'long'});
        const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
        let cal = `     ${mn} ${y}\nSu Mo Tu We Th Fr Sa\n${'   '.repeat(first)}`;
        for (let i=1;i<=days;i++) {
          cal += (i===d.getDate() ? `\x1b[7m${String(i).padStart(2)}\x1b[0m ` : String(i).padStart(2)+' ');
          if((first+i)%7===0) cal+='\n';
        }
        w(cal); break;
      }
      case 'env':
        w('PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin\nHOME=/root\nUSER=root\nSHELL=/bin/bash\nTERM=xterm-256color\nSCRIBE_OS=2.0'); break;
      case 'free':
        w('              total        used        free\nMem:        8167940     3284156     1892784\nSwap:       2097148           0     2097148'); break;
      case 'df':
        w('Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/sda1       51200000 18432560  32767440  36% /'); break;
      case 'top': case 'htop':
        w(`top - ${new Date().toLocaleTimeString()} up ${Math.floor(performance.now()/60000)} min\nTasks: 127 total, 2 running\n%Cpu(s): ${(Math.random()*30+5).toFixed(1)} us\n\n  PID USER    %CPU %MEM COMMAND\n  142 root     ${(Math.random()*5).toFixed(1)}  0.2 scribe-wm\n  287 root     ${(Math.random()*15).toFixed(1)}  0.6 terminal\n  558 root     ${(Math.random()*20).toFixed(1)}  1.5 renderer`);
        break;
      case 'ps':
        w('  PID TTY      TIME CMD\n    1 ?    00:00:02 systemd\n  142 ?    00:00:01 scribe-wm\n  287 pts/0 00:00:00 bash'); break;
      case 'kill':
        if(!args[0]) wr('Usage: kill <pid>');
        else wg(`Process ${args[0]} terminated.`); break;
      case 'sudo': wy('[sudo] password for root: authenticated.'); break;
      case 'su': wy('Already running as root.'); break;

      // File ops
      case 'ls': case 'dir': {
        const p = pos[0] ? `${cwd()}/${pos[0]}` : cwd();
        const node = getNode(p);
        if (node?.children) {
          if (flags.has('-l') || flags.has('-la') || flags.has('-al')) {
            w(`total ${node.children.length * 4}`);
            node.children.forEach(c => {
              const perm = c.type==='folder' ? '\x1b[34mdrwxr-xr-x' : '-rw-r--r--';
              w(`${perm}\x1b[0m 1 root root ${String(c.size||4096).padStart(6)} Mar 8 00:00 ${c.type==='folder'?'\x1b[34m':''}${c.name}\x1b[0m`);
            });
          } else {
            const items = node.children.map(c => c.type==='folder' ? `\x1b[34m${c.name}/\x1b[0m` : c.name);
            w(items.join('  ') || '(empty)');
          }
        } else wr(`ls: cannot access '${p}': No such directory`);
        break;
      }
      case 'cd':
        if (!args[0]||args[0]==='~') { setCwd('C:/Users/Scribe'); break; }
        if (args[0]==='..') { const p=cwd().split('/'); if(p.length>1) setCwd(p.slice(0,-1).join('/')); break; }
        if (args[0]==='/') { setCwd('C:'); break; }
        { const target=`${cwd()}/${args[0]}`; const node=getNode(target);
          if(node?.type==='folder') setCwd(target);
          else wr(`cd: ${args[0]}: No such directory`); }
        break;
      case 'cat':
        if(!args[0]) { wr('Usage: cat <file>'); break; }
        { const node=getNode(`${cwd()}/${args[0]}`);
          if(node?.type==='file') w(node.content||'');
          else wr(`cat: ${args[0]}: No such file`); }
        break;
      case 'head':
        if(!args[0]) { wr('Usage: head <file>'); break; }
        { const node=getNode(`${cwd()}/${args[0]}`);
          if(node?.type==='file') w((node.content||'').split('\n').slice(0,10).join('\n'));
          else wr(`head: ${args[0]}: No such file`); }
        break;
      case 'tail':
        if(!args[0]) { wr('Usage: tail <file>'); break; }
        { const node=getNode(`${cwd()}/${args[0]}`);
          if(node?.type==='file') w((node.content||'').split('\n').slice(-10).join('\n'));
          else wr(`tail: ${args[0]}: No such file`); }
        break;
      case 'grep':
        if(args.length<2) { wr('Usage: grep <pattern> <file>'); break; }
        { const node=getNode(`${cwd()}/${args[1]}`);
          if(node?.type==='file') {
            const m=(node.content||'').split('\n').filter(l=>l.includes(args[0]));
            w(m.length ? m.map(l=>l.replace(new RegExp(args[0],'g'),`\x1b[31m${args[0]}\x1b[0m`)).join('\n') : 'No matches');
          } else wr(`grep: ${args[1]}: No such file`); }
        break;
      case 'wc':
        if(!args[0]) { wr('Usage: wc <file>'); break; }
        { const node=getNode(`${cwd()}/${args[0]}`);
          if(node?.type==='file') { const c=node.content||'';
            w(`  ${c.split('\n').length}  ${c.split(/\s+/).filter(Boolean).length}  ${c.length} ${args[0]}`);
          } else wr(`wc: ${args[0]}: No such file`); }
        break;
      case 'find':
        if(!args[0]) { wr('Usage: find <name>'); break; }
        { const results:string[]=[];
          const search=(node:any,path:string)=>{ if(node.name.includes(args[0])) results.push(path+'/'+node.name); node.children?.forEach((c:any)=>search(c,path+'/'+node.name)); };
          search(fs,''); w(results.length?results.join('\n'):`No files matching '${args[0]}'`); }
        break;
      case 'mkdir':
        if(!args[0]) wr('Usage: mkdir <name>');
        else { createFolder(cwd(),args[0]); wg(`Created: ${args[0]}`); } break;
      case 'touch':
        if(!args[0]) wr('Usage: touch <name>');
        else { writeFile(`${cwd()}/${args[0]}`,''); wg(`Created: ${args[0]}`); } break;
      case 'rm':
        if(!args[0]) wr('Usage: rm <name>');
        else { deleteNode(`${cwd()}/${args[0]}`); wg(`Removed: ${args[0]}`); } break;
      case 'cp':
        if(args.length<2) wr('Usage: cp <src> <dst>');
        else wg(`'${args[0]}' -> '${args[1]}'`); break;
      case 'mv':
        if(args.length<2) wr('Usage: mv <src> <dst>');
        else wg(`renamed '${args[0]}' -> '${args[1]}'`); break;
      case 'which':
        if(!args[0]) wr('Usage: which <cmd>');
        else w(`/usr/bin/${args[0]}`); break;
      case 'man':
        if(!args[0]) wr('What manual page do you want?');
        else w(`\x1b[1m${args[0].toUpperCase()}(1)\x1b[0m\t\tScribe OS Manual\n\nNAME\n\t${args[0]} - command utility\n\nSYNOPSIS\n\t${args[0]} [OPTIONS] [ARGS]`); break;

      // Network
      case 'ping':
        if(!args[0]) { wr('Usage: ping <host>'); break; }
        { const ip=rIP();
          w(`PING ${args[0]} (${ip}) 56(84) bytes of data.`);
          for(let i=0;i<4;i++) w(`64 bytes from ${args[0]} (${ip}): icmp_seq=${i+1} ttl=64 time=${(Math.random()*40+5).toFixed(1)} ms`);
          w(`\n--- ${args[0]} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`); }
        break;
      case 'traceroute':
        if(!args[0]) { wr('Usage: traceroute <host>'); break; }
        w(`traceroute to ${args[0]}, 30 hops max`);
        for(let i=0;i<Math.floor(Math.random()*6+4);i++)
          w(` ${String(i+1).padStart(2)}  ${i===Math.floor(Math.random()*6+3)?args[0]:rIP()}  ${(Math.random()*50+1).toFixed(3)} ms`);
        break;
      case 'nmap': {
        const target=pos[0];
        if(!target) { wr('Usage: nmap [-sV|-sS|-A|-p] <host>'); break; }
        wg(`Starting Nmap 7.94SVN ( https://nmap.org ) at ${new Date().toISOString()}`);
        w(`NSE: Loaded 156 scripts for scanning.`);
        w(`Scanning ${target} (${rIP()})...`);
        const ports = [
          {p:22,s:'ssh',st:'open',v:'OpenSSH 9.2p1 Debian'},
          {p:80,s:'http',st:'open',v:'nginx 1.24.0'},
          {p:443,s:'https',st:'open',v:'nginx 1.24.0'},
          {p:3306,s:'mysql',st:Math.random()>.5?'open':'filtered',v:'MySQL 8.0.33'},
          {p:5432,s:'postgresql',st:Math.random()>.6?'open':'closed',v:'PostgreSQL 15.3'},
          {p:6379,s:'redis',st:Math.random()>.7?'open':'filtered',v:'Redis 7.0.11'},
          {p:8080,s:'http-proxy',st:Math.random()>.5?'open':'closed',v:'Apache 2.4.57'},
          {p:27017,s:'mongodb',st:Math.random()>.8?'open':'filtered',v:'MongoDB 6.0.8'},
        ];
        w(`\n\x1b[1mPORT      STATE     SERVICE         VERSION\x1b[0m`);
        ports.forEach(p => {
          const stColor = p.st==='open'?'\x1b[32m':p.st==='filtered'?'\x1b[33m':'\x1b[31m';
          w(`${String(p.p)+'/tcp'} ${' '.repeat(Math.max(1,6-String(p.p).length))}${stColor}${p.st.padEnd(10)}\x1b[0m${p.s.padEnd(16)}${(flags.has('-sV')||flags.has('-A'))?p.v:''}`);
        });
        if (flags.has('-A')) {
          w(`\n\x1b[1mOS detection:\x1b[0m\n  Running: Linux 5.x|6.x\n  Aggressive OS guesses: Linux 6.1 (98%)`);
          w(`\n\x1b[1mTraceroute:\x1b[0m\nHOP RTT     ADDRESS\n1   0.42ms  gateway (192.168.1.1)\n2   12.8ms  ${rIP()}\n3   24.1ms  ${target}`);
        }
        wg(`\nNmap done: 1 IP address (1 host up) scanned in ${(Math.random()*15+5).toFixed(2)} seconds`);
        break;
      }
      case 'nikto': {
        const target=pos[0]||pos.find(a=>a.includes('.'));
        if(!target) { wr('Usage: nikto -h <host>'); break; }
        wc(`- Nikto v2.5.0\n---------------------------------------------------------------------------`);
        w(`+ Target IP:          ${rIP()}\n+ Target Hostname:    ${target}\n+ Target Port:        80\n+ Start Time:         ${new Date().toISOString()}\n---------------------------------------------------------------------------\n+ Server: nginx/1.24.0`);
        wy(`+ /: The anti-clickjacking X-Frame-Options header is not present.`);
        wy(`+ /: The X-Content-Type-Options header is not set.`);
        wr(`+ /admin/: Directory indexing found.`);
        wr(`+ /.git/: Git repository found.`);
        wy(`+ /server-status: Apache server-status accessible.`);
        wg(`+ ${Math.floor(Math.random()*15+5)} item(s) reported on remote host`);
        break;
      }
      case 'sqlmap': {
        const target=pos[0]||args.find(a=>a.startsWith('--url='))?.slice(6);
        if(!target) { wr('Usage: sqlmap -u <url> [--dbs] [--dump]'); break; }
        wg(`        ___\n       __H__\n ___ ___[']_____ ___ ___  {1.7.10#stable}\n|_ -| . [)]     | .'| . |\n|___|_  ["]_|_|_|__,|  _|\n      |_|V...       |_|   https://sqlmap.org`);
        w(`\n[*] starting @ ${new Date().toLocaleTimeString()}`);
        w(`[INFO] testing connection to the target URL`);
        w(`[INFO] testing if GET parameter 'id' is dynamic`);
        wg(`[INFO] GET parameter 'id' appears to be 'AND boolean-based blind' injectable`);
        wg(`[INFO] GET parameter 'id' is 'MySQL >= 5.0 AND error-based' injectable`);
        wg(`\nParameter: id (GET)\n    Type: boolean-based blind\n    Payload: id=1 AND 5734=5734\n\n    Type: error-based\n    Payload: id=1 AND (SELECT 1234 FROM(SELECT COUNT(*),CONCAT(0x716b627871,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a)`);
        w(`\n[INFO] the back-end DBMS is MySQL\nback-end DBMS: MySQL >= 5.0`);
        if(flags.has('--dbs')) wg(`\navailable databases [5]:\n[*] information_schema\n[*] mysql\n[*] performance_schema\n[*] webapp_db\n[*] admin_panel`);
        break;
      }
      case 'hydra': {
        const target=pos[0];
        if(!target) { wr('Usage: hydra -l <user> -P <wordlist> <host> <service>'); break; }
        wg(`Hydra v9.5 (c) 2023 by van Hauser/THC`);
        w(`\n[DATA] max 16 tasks, 14344399 login tries\n[DATA] attacking ssh://${target}:22/`);
        for(let i=0;i<5;i++) w(`[ATTEMPT] target ${target} - login: admin - pass: ${['password','123456','admin','root','letmein'][i]}`);
        wg(`[22][ssh] host: ${target}   login: admin   password: P@ssw0rd!`);
        wg(`1 of 1 target successfully completed, 1 valid password found`);
        break;
      }
      case 'john': {
        if(!args[0]) { wr('Usage: john <hashfile>'); break; }
        w(`Using default input encoding: UTF-8\nLoaded ${Math.floor(Math.random()*5+1)} password hashes\nWill run ${navigator.hardwareConcurrency||4} OpenMP threads`);
        wg(`password123  (user1)\nadmin2026    (user2)\ns3cur1ty!    (user3)`);
        wg(`3 password hashes cracked, 0 left`);
        break;
      }
      case 'hashcat': {
        if(!args[0]) { wr('Usage: hashcat -m <type> <hash> <wordlist>'); break; }
        wg(`hashcat (v6.2.6) starting`);
        w(`OpenCL API (OpenCL 3.0) - Platform #1 [WebGPU]\n* Device #1: Virtual GPU, 2048/4096 MB`);
        wg(`\n${rHash()}:password123\n\nStatus: Cracked\nHash.Mode: 0 (MD5)\nSpeed: ${Math.floor(Math.random()*500+200)}MH/s\nRecovered: 1/1 (100.00%)`);
        break;
      }
      case 'dirb': case 'gobuster': {
        const target=pos[0];
        if(!target) { wr(`Usage: ${command} <url>`); break; }
        wg(`${command.toUpperCase()} v2.0`);
        w(`[+] Url:       ${target}\n[+] Wordlist:  /usr/share/wordlists/dirb/common.txt`);
        const dirs=['/admin','/api','/backup','/config','/css','/login','/uploads','/.git','/.env','/phpmyadmin'];
        dirs.forEach(d => {
          const code=[200,301,403][Math.floor(Math.random()*3)];
          const color=code===200?'\x1b[32m':code===403?'\x1b[33m':'\x1b[0m';
          w(`${color}${d.padEnd(25)} (Status: ${code}) [Size: ${Math.floor(Math.random()*50000+100)}]\x1b[0m`);
        });
        wg(`\n${dirs.length} results found.`);
        break;
      }
      case 'wpscan': {
        const target=pos[0];
        if(!target) { wr('Usage: wpscan --url <target>'); break; }
        wc(`         __          _______   _____\n         \\ \\        / /  __ \\ / ____|\n          \\ \\  /\\  / /| |__) | (___   ___  __ _ _ __\n           \\ \\/  \\/ / |  ___/ \\___ \\ / __|/ _\` | '_ \\\n            \\  /\\  /  | |     ____) | (__| (_| | | | |\n             \\/  \\/   |_|    |_____/ \\___|\\__,_|_| |_|`);
        w(`\n[+] URL: ${target}\n[i] WordPress version 6.4.2 identified.`);
        wr(`[!] 3 vulnerabilities identified:\n  [!] WordPress 6.4.x - SQL Injection (Fixed in 6.4.3)\n  [!] WordPress 6.4.x - XSS in Admin`);
        w(`\n[+] Theme: flavor v1.2.1\n[+] Plugins: contact-form-7, yoast-seo`);
        break;
      }
      case 'searchsploit': {
        if(!args[0]) { wr('Usage: searchsploit <query>'); break; }
        const q=args.join(' ');
        w(`${'─'.repeat(60)}\n Exploit Title                              |  Path\n${'─'.repeat(60)}`);
        [[`${q} - RCE`,`exploits/linux/remote/51234.py`],[`${q} - SQLi`,`exploits/php/webapps/49876.txt`],[`${q} - Buffer Overflow`,`exploits/linux/dos/48234.c`],[`${q} - Priv Esc`,`exploits/linux/local/50123.sh`]].forEach(e=>w(`${e[0].padEnd(44)}| ${e[1]}`));
        break;
      }
      case 'airmon-ng':
        w('PHY\tInterface\tDriver\t\tChipset\nphy0\twlan0\t\tath9k_htc\tAtheros AR9271');
        if(args[0]==='start') wg('(monitor mode enabled on wlan0mon)'); break;
      case 'airodump-ng':
        w(` CH 6 ][ Elapsed: 12 s\n\n BSSID              PWR  Beacons  #Data  CH   ENC   ESSID\n ${rMAC()}  -42  47       324    6    WPA2  HomeNetwork-5G\n ${rMAC()}  -58  32       156    6    WPA2  TP-Link_${Math.floor(Math.random()*9999)}\n ${rMAC()}  -73  12       45     1    WEP   linksys\n ${rMAC()}  -81  8        12     6    OPN   FreeWiFi`); break;
      case 'aircrack-ng':
        if(!args[0]) { wr('Usage: aircrack-ng <capture.cap>'); break; }
        w(`Aircrack-ng 1.7\n\n[00:00:${String(Math.floor(Math.random()*59)).padStart(2,'0')}] ${Math.floor(Math.random()*50000+10000)} keys tested`);
        wg(`\n                KEY FOUND! [ ${Array.from({length:5},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':')} ]`);
        break;
      case 'reaver':
        wg(`Reaver v1.6.6\n[+] WPS PIN: ${String(Math.floor(Math.random()*99999999)).padStart(8,'0')}\n[+] WPA PSK: 'Summer2026!'\n[+] AP SSID: 'TargetNetwork'`); break;
      case 'msfconsole':
        wg(`\n       =[ metasploit v6.3.44-dev                          ]\n+ -- --=[ 2345 exploits - 1234 auxiliary - 412 post       ]\n+ -- --=[ 1287 payloads - 47 encoders - 11 nops           ]`);
        wy(`\nmsf6 > Simulation mode — no real exploits.`); break;
      case 'msfvenom':
        w(`Payload size: ${Math.floor(Math.random()*400+200)} bytes\nSaved as: /tmp/payload.exe`);
        wy(`Simulation only — no real payload.`); break;
      case 'wireshark':
        w(`Wireshark 4.0.10 — capturing on 'eth0'\nPackets: ${Math.floor(Math.random()*1000+100)}`);
        wy(`GUI not available. Use tcpdump.`); break;
      case 'tcpdump':
        for(let i=0;i<6;i++) w(`${new Date().toLocaleTimeString()} IP ${rIP()}.${Math.floor(Math.random()*60000+1024)} > ${rIP()}.${[80,443,22][Math.floor(Math.random()*3)]}: Flags [${['S','P.','F.'][Math.floor(Math.random()*3)]}], length ${Math.floor(Math.random()*1500)}`);
        w(`\n6 packets captured`); break;
      case 'ettercap':
        w(`ettercap 0.8.3.1\nListening on eth0...\n${rMAC()} ${rIP()}`);
        wy(`Simulation mode — no MITM.`); break;
      case 'arpspoof': wy(`ARP spoofing simulated.`); break;
      case 'dnsrecon': {
        const domain=pos[0]||'example.com';
        wg(`[*] Performing General Enumeration: ${domain}`);
        w(`[*] A ${domain} ${rIP()}\n[*] MX mail.${domain} ${rIP()}\n[*] NS ns1.${domain} ${rIP()}\n[*] TXT "v=spf1 include:_spf.google.com ~all"`);
        wg(`[+] ${Math.floor(Math.random()*10+5)} Records Found`); break;
      }
      case 'theharvester': {
        const domain=pos[0]||'example.com';
        wc(`*  _   _                                            _             *\n* | |_| |__   ___    /\\  /\\__ _ _ ____   _____  ___| |_ ___ _ __  *`);
        wg(`[*] Emails found: ${Math.floor(Math.random()*5+2)}`);
        ['admin','info','support'].forEach(u => w(` - ${u}@${domain}`));
        wg(`[*] Hosts found: ${Math.floor(Math.random()*4+2)}`);
        ['www','mail','api'].forEach(s => w(` - ${s}.${domain}: ${rIP()}`));
        break;
      }
      case 'crunch':
        wg(`Crunch will generate ${Math.floor(Math.random()*1000000+100000)} lines`);
        wy(`Wordlist generation simulated.`); break;

      // Network
      case 'ifconfig': case 'ip':
        w(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet ${rIP()}  netmask 255.255.255.0\n        ether ${rMAC()}\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0`); break;
      case 'netstat': case 'ss':
        w(`Proto Local Address          Foreign Address        State\ntcp   0.0.0.0:22             0.0.0.0:*              LISTEN\ntcp   0.0.0.0:80             0.0.0.0:*              LISTEN\ntcp   ${rIP()}:22        ${rIP()}:${Math.floor(Math.random()*60000+1024)}   ESTABLISHED`); break;
      case 'arp':
        w(`Address         HWtype  HWaddress\n192.168.1.1     ether   ${rMAC()}\n192.168.1.${Math.floor(Math.random()*254+2)}   ether   ${rMAC()}`); break;
      case 'route':
        w(`Destination     Gateway         Genmask         Flags\n0.0.0.0         192.168.1.1     0.0.0.0         UG\n192.168.1.0     0.0.0.0         255.255.255.0   U`); break;
      case 'dig': case 'nslookup': {
        const domain=pos[0]||'example.com';
        w(`;; ANSWER SECTION:\n${domain}.\t300\tIN\tA\t${rIP()}\n${domain}.\t3600\tIN\tMX\t10 mail.${domain}.\n${domain}.\t3600\tIN\tNS\tns1.${domain}.\n\n;; Query time: ${Math.floor(Math.random()*50+5)} msec`); break;
      }
      case 'whois': {
        const domain=pos[0]||'example.com';
        w(`Domain Name: ${domain.toUpperCase()}\nRegistrar: NameCheap, Inc.\nCreation Date: 2019-03-15\nExpiry Date: 2027-03-15\nName Server: ns1.cloudflare.com\nDNSSEC: unsigned`); break;
      }
      case 'wget': case 'curl':
        if(!args[0]) { wr(`Usage: ${command} <url>`); break; }
        w(`Resolving ${args[0]}... ${rIP()}\nConnecting... connected.\nHTTP/1.1 200 OK\nLength: ${Math.floor(Math.random()*50000+1000)}\nSaving to: 'index.html'`);
        wg(`'index.html' saved`); break;
      case 'ssh':
        if(!args[0]) { wr('Usage: ssh <user@host>'); break; }
        w(`ED25519 key fingerprint is SHA256:${rHash(43)}.`);
        wy(`SSH connections are simulated.`); break;

      // Utils
      case 'base64':
        if(args[0]) w(btoa(args.join(' ')));
        else wr('Usage: base64 <text>'); break;
      case 'md5sum': w(`${rHash(32)}  ${args[0]||'stdin'}`); break;
      case 'sha256sum': w(`${rHash(64)}  ${args[0]||'stdin'}`); break;
      case 'xxd': {
        const text=args.join(' ')||'Hello';
        w(`00000000: ${Array.from(text).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ')}  ${text}`); break;
      }
      case 'openssl': w('OpenSSL 3.1.4 24 Oct 2023'); break;
      case 'gpg': w('gpg (GnuPG) 2.2.40'); break;
      case 'export': wg('Environment variable set.'); break;
      case 'alias': w("alias ll='ls -la'\nalias grep='grep --color=auto'"); break;
      case 'jobs': w('[1]+  Running  nmap -sV target &'); break;
      case 'du': w('4.0K\t./Documents\n8.0K\t./Desktop\n26K\t.'); break;
      case 'history':
        w(historyRef.current.map((h,i)=>`  ${String(i+1).padStart(4)}  ${h}`).join('\n')); break;
      case 'neofetch': case 'screenfetch':
        wc(`   ╔══════════════════╗`);
        wc(`   ║   ██████╗ ██████╗║     \x1b[0mscribe@scribe-os`);
        wc(`   ║  ██╔════╝██╔═══╝║     \x1b[0m──────────────────────`);
        wc(`   ║  ╚█████╗ ██║    ║     \x1b[0mOS: Scribe OS 2.0 Kali Edition`);
        wc(`   ║   ╚═══██╗██║    ║     \x1b[0mKernel: 6.1.0-kali9-amd64`);
        wc(`   ║  ██████╔╝╚█████╗║     \x1b[0mUptime: ${Math.floor(performance.now()/60000)} mins`);
        wc(`   ║  ╚═════╝  ╚════╝║     \x1b[0mShell: scribe-sh 2.0`);
        wc(`   ╚══════════════════╝     \x1b[0mTerminal: xterm.js`);
        w(`                            CPU: vCPU (${navigator.hardwareConcurrency||4}) @ 3.6GHz`);
        w(`                            Memory: ${Math.round(((performance as any).memory?.usedJSHeapSize||134217728)/1048576)}MiB / ${Math.round(((performance as any).memory?.totalJSHeapSize||536870912)/1048576)}MiB`);
        w(`\n   \x1b[40m  \x1b[41m  \x1b[42m  \x1b[43m  \x1b[44m  \x1b[45m  \x1b[46m  \x1b[47m  \x1b[0m`);
        break;
      case '': break;
      default:
        wr(`bash: ${command}: command not found. Try 'help' or 'tools'.`);
    }
    writePrompt();
  }, [getNode, writeFile, createFolder, deleteNode, fs, writePrompt]);

  useEffect(() => {
    if (!containerRef.current || termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: '#0a0e14',
        foreground: '#b3b1ad',
        cursor: '#26bbd9',
        cursorAccent: '#0a0e14',
        selectionBackground: '#264f78',
        black: '#01060e',
        red: '#ea6c73',
        green: '#91b362',
        yellow: '#f9af4f',
        blue: '#53bdfa',
        magenta: '#fae994',
        cyan: '#26bbd9',
        white: '#c7c7c7',
        brightBlack: '#686868',
        brightRed: '#f07178',
        brightGreen: '#c2d94c',
        brightYellow: '#ffb454',
        brightBlue: '#59c2ff',
        brightMagenta: '#ffee99',
        brightCyan: '#95e6cb',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
      scrollback: 5000,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);

    // Delay fit to ensure container is sized
    requestAnimationFrame(() => {
      try { fit.fit(); } catch {}
    });

    termRef.current = term;
    fitRef.current = fit;

    // Welcome
    term.write('\x1b[1;36m┌──────────────────────────────────────────────────┐\x1b[0m\r\n');
    term.write('\x1b[1;36m│\x1b[0m  \x1b[1;32mScribe OS Terminal v2.0 — Kali Edition\x1b[0m          \x1b[1;36m│\x1b[0m\r\n');
    term.write('\x1b[1;36m│\x1b[0m  \x1b[2mPowered by xterm.js\x1b[0m                              \x1b[1;36m│\x1b[0m\r\n');
    term.write('\x1b[1;36m└──────────────────────────────────────────────────┘\x1b[0m\r\n');
    term.write('\x1b[2mType "help" for commands. Type "tools" for security tools.\x1b[0m');
    writePrompt();

    // Handle input
    term.onData(data => {
      if (data === '\r') {
        // Enter
        processCommand(lineRef.current);
        lineRef.current = '';
      } else if (data === '\x7f') {
        // Backspace
        if (lineRef.current.length > 0) {
          lineRef.current = lineRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\x1b[A') {
        // Arrow up
        if (historyRef.current.length > 0) {
          const idx = histIdxRef.current === -1 ? historyRef.current.length - 1 : Math.max(0, histIdxRef.current - 1);
          histIdxRef.current = idx;
          // Clear current line
          term.write('\r\x1b[K');
          term.write(`\x1b[1;36m└─\x1b[1;31m$\x1b[0m ${historyRef.current[idx]}`);
          lineRef.current = historyRef.current[idx];
        }
      } else if (data === '\x1b[B') {
        // Arrow down
        if (histIdxRef.current >= 0) {
          const idx = histIdxRef.current + 1;
          term.write('\r\x1b[K');
          if (idx >= historyRef.current.length) {
            histIdxRef.current = -1;
            term.write(`\x1b[1;36m└─\x1b[1;31m$\x1b[0m `);
            lineRef.current = '';
          } else {
            histIdxRef.current = idx;
            term.write(`\x1b[1;36m└─\x1b[1;31m$\x1b[0m ${historyRef.current[idx]}`);
            lineRef.current = historyRef.current[idx];
          }
        }
      } else if (data === '\t') {
        // Tab completion
        const cmds = ['help','tools','ls','dir','cd','cat','echo','mkdir','touch','rm','clear','cls','pwd','whoami','id','hostname','uname','uptime','date','cal','env','history','ping','nmap','nikto','sqlmap','hydra','john','hashcat','dirb','gobuster','wpscan','searchsploit','airmon-ng','airodump-ng','aircrack-ng','reaver','msfconsole','msfvenom','wireshark','tcpdump','ettercap','arpspoof','ifconfig','netstat','ss','traceroute','dig','nslookup','whois','dnsrecon','theharvester','wget','curl','ssh','neofetch','top','htop','ps','kill','free','df','du','find','grep','head','tail','wc','base64','md5sum','sha256sum','man','which','sudo'];
        const match = cmds.filter(c => c.startsWith(lineRef.current.toLowerCase()));
        if (match.length === 1) {
          const remaining = match[0].slice(lineRef.current.length);
          lineRef.current = match[0];
          term.write(remaining);
        } else if (match.length > 1) {
          term.write('\r\n' + match.join('  '));
          writePrompt();
          term.write(lineRef.current);
        }
      } else if (data >= ' ') {
        lineRef.current += data;
        term.write(data);
      }
    });

    // Resize observer
    const ro = new ResizeObserver(() => {
      try { fit.fit(); } catch {}
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      term.dispose();
      termRef.current = null;
    };
  }, [processCommand, writePrompt]);

  return <div ref={containerRef} className="h-full w-full" style={{ padding: '4px', background: '#0a0e14' }} />;
}
