import React, { useState } from 'react';
import { Inbox, Send, Star, Trash2, Archive, Search, Paperclip, Reply, MoreVertical, Mail, Edit3 } from 'lucide-react';

interface Email { id: string; from: string; subject: string; preview: string; body: string; time: string; read: boolean; starred: boolean; folder: string; }

const EMAILS: Email[] = [
  { id: '1', from: 'GitHub', subject: 'Security alert: new sign-in', preview: 'A new sign-in to your account...', body: 'A new sign-in to your GitHub account was detected from Chrome on Windows.\n\nIP: 203.0.113.42\nLocation: Mumbai, India\nTime: 2 minutes ago\n\nIf this was you, you can ignore this email.', time: '10:24 AM', read: false, starred: false, folder: 'inbox' },
  { id: '2', from: 'ProtonMail Team', subject: 'Welcome to ProtonMail', preview: 'Your encrypted inbox is ready...', body: 'Welcome to ProtonMail!\n\nYour end-to-end encrypted inbox is ready. All messages are stored with zero-access encryption.\n\nEnjoy your privacy.', time: '9:15 AM', read: false, starred: true, folder: 'inbox' },
  { id: '3', from: 'Docker Hub', subject: 'Image push successful', preview: 'scribeos/core:latest pushed...', body: 'Successfully pushed image:\n\nscribeos/core:latest\nSize: 142MB\nDigest: sha256:a1b2c3d4e5f6...\n\nView on Docker Hub.', time: 'Yesterday', read: true, starred: false, folder: 'inbox' },
  { id: '4', from: 'Stripe', subject: 'Payment received - $49.00', preview: 'You received a payment...', body: 'Payment received!\n\nAmount: $49.00\nFrom: customer@example.com\nDescription: Pro subscription\n\nFunds will be available in 2 business days.', time: 'Yesterday', read: true, starred: false, folder: 'inbox' },
  { id: '5', from: 'Vercel', subject: 'Deployment successful', preview: 'scribe-os.vercel.app is live...', body: 'Deployment Status: Ready ✓\n\nProject: scribe-os\nURL: scribe-os.vercel.app\nBranch: main\nCommit: feat: add browser app\n\nBuild time: 42s', time: 'Mar 5', read: true, starred: false, folder: 'inbox' },
];

const FOLDERS = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, count: 2 },
  { id: 'starred', name: 'Starred', icon: Star, count: 1 },
  { id: 'sent', name: 'Sent', icon: Send, count: 0 },
  { id: 'archive', name: 'Archive', icon: Archive, count: 0 },
  { id: 'trash', name: 'Trash', icon: Trash2, count: 0 },
];

export default function EmailClientApp({ windowId }: { windowId: string }) {
  const [emails, setEmails] = useState(EMAILS);
  const [folder, setFolder] = useState('inbox');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [composing, setComposing] = useState(false);

  const folderEmails = emails.filter(e => folder === 'starred' ? e.starred : e.folder === folder);
  const filtered = search ? folderEmails.filter(e => e.subject.toLowerCase().includes(search.toLowerCase()) || e.from.toLowerCase().includes(search.toLowerCase())) : folderEmails;
  const active = emails.find(e => e.id === selected);

  const selectEmail = (id: string) => {
    setSelected(id);
    setEmails(p => p.map(e => e.id === id ? { ...e, read: true } : e));
  };

  return (
    <div className="h-full flex bg-[hsl(var(--os-window-body))]">
      {/* Sidebar */}
      <div className="w-40 border-r border-border/20 flex flex-col shrink-0">
        <button onClick={() => setComposing(true)} className="mx-2 mt-2 mb-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5">
          <Edit3 size={12} /> Compose
        </button>
        <div className="flex-1 py-1">
          {FOLDERS.map(f => (
            <button key={f.id} onClick={() => { setFolder(f.id); setSelected(null); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors ${folder === f.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/20'}`}>
              <f.icon size={13} />
              <span className="flex-1 text-left">{f.name}</span>
              {f.count > 0 && <span className="text-[9px] px-1.5 py-0 rounded-full bg-primary/20 text-primary">{f.count}</span>}
            </button>
          ))}
        </div>
        <div className="px-3 py-2 text-[9px] text-muted-foreground border-t border-border/10">
          scribe@proton.me
        </div>
      </div>

      {/* Email list */}
      <div className="w-56 border-r border-border/20 flex flex-col shrink-0">
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/10">
          <Search size={10} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mail..." className="flex-1 bg-transparent text-[10px] outline-none text-foreground" />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-os">
          {filtered.map(e => (
            <button key={e.id} onClick={() => selectEmail(e.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-border/5 hover:bg-muted/20 transition-colors ${selected === e.id ? 'bg-primary/10' : ''} ${!e.read ? 'bg-muted/10' : ''}`}>
              <div className="flex items-center gap-1">
                <span className={`text-[11px] truncate flex-1 ${!e.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>{e.from}</span>
                <span className="text-[9px] text-muted-foreground shrink-0">{e.time}</span>
              </div>
              <div className={`text-[10px] truncate ${!e.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{e.subject}</div>
              <div className="text-[9px] text-muted-foreground truncate">{e.preview}</div>
            </button>
          ))}
          {filtered.length === 0 && <div className="text-center py-8 text-xs text-muted-foreground">No emails</div>}
        </div>
      </div>

      {/* Email detail / Compose */}
      <div className="flex-1 flex flex-col">
        {composing ? (
          <div className="flex-1 flex flex-col p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">New Message</span>
              <button onClick={() => setComposing(false)} className="text-[10px] text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
            <input placeholder="To:" className="bg-muted/20 rounded px-2 py-1.5 text-[11px] text-foreground outline-none mb-1" />
            <input placeholder="Subject:" className="bg-muted/20 rounded px-2 py-1.5 text-[11px] text-foreground outline-none mb-1" />
            <textarea placeholder="Compose email..." className="flex-1 bg-muted/20 rounded p-2 text-[11px] text-foreground outline-none resize-none" />
            <div className="flex items-center justify-between mt-2">
              <button className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground"><Paperclip size={14} /></button>
              <button className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 flex items-center gap-1"><Send size={11} /> Send</button>
            </div>
          </div>
        ) : active ? (
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-border/10">
              <div className="text-sm font-semibold text-foreground">{active.subject}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">From: {active.from} • {active.time}</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-os px-4 py-3">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{active.body}</pre>
            </div>
            <div className="flex items-center gap-1 px-3 py-2 border-t border-border/10">
              <button className="px-3 py-1 bg-secondary/30 rounded text-[10px] text-foreground hover:bg-secondary/50 flex items-center gap-1"><Reply size={10} /> Reply</button>
              <button onClick={() => setEmails(p => p.map(e => e.id === active.id ? { ...e, starred: !e.starred } : e))}
                className={`p-1 rounded hover:bg-muted/30 ${active.starred ? 'text-yellow-500' : 'text-muted-foreground'}`}><Star size={13} /></button>
              <button onClick={() => { setEmails(p => p.map(e => e.id === active.id ? { ...e, folder: 'trash' } : e)); setSelected(null); }}
                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground"><Trash2 size={13} /></button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail size={32} className="mx-auto mb-2 opacity-30" />
              <div className="text-xs">Select an email to read</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
