import React, { useState } from 'react';
import { Mail, Send, Inbox, Star, Trash2, AlertCircle, CheckCircle, Paperclip, Reply, Forward, Archive, Search, Plus } from 'lucide-react';
import { supabase } from "@/lib/supabase/client";

interface ComposeEmail {
  to: string;
  subject: string;
  body: string;
}

interface EmailItem {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
  avatar: string;
}

const MOCK_EMAILS: EmailItem[] = [
  { id: '1', from: 'GitHub', subject: 'Security alert for scribe-os', preview: 'We found a potential vulnerability in your repository...', time: '2m ago', read: false, starred: true, avatar: '🐙' },
  { id: '2', from: 'Tor Project', subject: 'Monthly relay operator newsletter', preview: 'Thank you for running a Tor relay. Here are the latest updates...', time: '1h ago', read: false, starred: false, avatar: '🧅' },
  { id: '3', from: 'ProtonMail', subject: 'Your encrypted backup is ready', preview: 'Your weekly encrypted backup has been completed successfully...', time: '3h ago', read: true, starred: false, avatar: '📧' },
  { id: '4', from: 'Hacker News', subject: 'Top stories this week', preview: 'Show HN: Browser-based operating system built with React...', time: '5h ago', read: true, starred: true, avatar: '📰' },
  { id: '5', from: 'npm Security', subject: 'Audit report for scribe-os', preview: 'Found 0 vulnerabilities in 847 scanned packages...', time: '1d ago', read: true, starred: false, avatar: '📦' },
];

const EmailClientApp: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [compose, setCompose] = useState<ComposeEmail>({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emails, setEmails] = useState(MOCK_EMAILS);
  const [search, setSearch] = useState('');

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compose.to || !compose.subject || !compose.body) {
      setStatus({ type: 'error', message: 'Please fill all fields' });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to: compose.to, subject: compose.subject, body: compose.body },
      });
      if (error) throw new Error(error.message);
      if (data?.error) setStatus({ type: 'error', message: data.error });
      else {
        setStatus({ type: 'success', message: 'Email sent!' });
        setCompose({ to: '', subject: '', body: '' });
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to send';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setStatus({ type: 'error', message: errorMessage });
    } finally {
      setSending(false);
    }
  };

  const toggleStar = (id: string) => setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));

  const folders = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: emails.filter(e => !e.read).length },
    { id: 'starred', name: 'Starred', icon: Star, count: emails.filter(e => e.starred).length },
    { id: 'compose', name: 'Compose', icon: Send, count: 0 },
    { id: 'trash', name: 'Trash', icon: Trash2, count: 0 },
  ];

  const filteredEmails = search
    ? emails.filter(e => e.subject.toLowerCase().includes(search.toLowerCase()) || e.from.toLowerCase().includes(search.toLowerCase()))
    : emails;

  const selected = emails.find(e => e.id === selectedEmail);

  return (
    <div className="h-full flex bg-[hsl(var(--os-window-body))] text-foreground">
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r border-border/20 bg-secondary/5 flex flex-col">
        <div className="p-3 border-b border-border/10">
          <button
            onClick={() => setActiveFolder('compose')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Compose
          </button>
        </div>
        <nav className="flex-1 py-1">
          {folders.filter(f => f.id !== 'compose').map(folder => (
            <button
              key={folder.id}
              onClick={() => { setActiveFolder(folder.id); setSelectedEmail(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors ${
                activeFolder === folder.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
              }`}
            >
              <folder.icon size={14} />
              <span className="flex-1 text-left">{folder.name}</span>
              {folder.count > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">{folder.count}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-2 text-[9px] text-muted-foreground border-t border-border/10">
          📧 Scribe Mail v1.0
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeFolder === 'compose' ? (
          <form onSubmit={handleSendEmail} className="flex-1 flex flex-col p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Send size={14} className="text-primary" /> New Email
            </h2>
            {status && (
              <div className={`mb-3 p-2 rounded-lg flex items-center gap-2 text-xs ${
                status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive'
              }`}>
                {status.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                {status.message}
              </div>
            )}
            <div className="space-y-2 flex-1">
              <input type="email" value={compose.to} onChange={e => setCompose({ ...compose, to: e.target.value })}
                placeholder="To: recipient@email.com"
                className="w-full bg-muted/20 border border-border/20 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/50" required />
              <input type="text" value={compose.subject} onChange={e => setCompose({ ...compose, subject: e.target.value })}
                placeholder="Subject"
                className="w-full bg-muted/20 border border-border/20 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/50" required />
              <textarea value={compose.body} onChange={e => setCompose({ ...compose, body: e.target.value })}
                placeholder="Write your message..."
                className="w-full flex-1 min-h-[120px] bg-muted/20 border border-border/20 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/30 resize-none scrollbar-os placeholder:text-muted-foreground/50" required />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button type="submit" disabled={sending}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 disabled:opacity-40 flex items-center gap-2 font-medium">
                {sending ? <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Send size={12} />}
                {sending ? 'Sending...' : 'Send'}
              </button>
              <button type="button" className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground">
                <Paperclip size={14} />
              </button>
              <span className="text-[9px] text-muted-foreground ml-auto">via Resend</span>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex min-h-0">
            {/* Email list */}
            <div className={`${selectedEmail ? 'w-64' : 'flex-1'} border-r border-border/10 flex flex-col shrink-0`}>
              <div className="p-2 border-b border-border/10">
                <div className="flex items-center gap-1 bg-muted/20 rounded-lg px-2 py-1">
                  <Search size={11} className="text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emails..."
                    className="flex-1 bg-transparent text-[10px] outline-none text-foreground" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-os">
                {filteredEmails.map(email => (
                  <button
                    key={email.id}
                    onClick={() => { setSelectedEmail(email.id); setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e)); }}
                    className={`w-full text-left px-3 py-2.5 border-b border-border/5 transition-colors ${
                      selectedEmail === email.id ? 'bg-primary/10' : email.read ? 'hover:bg-muted/10' : 'bg-secondary/10 hover:bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{email.avatar}</span>
                      <span className={`flex-1 text-[11px] truncate ${!email.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>{email.from}</span>
                      <button onClick={e => { e.stopPropagation(); toggleStar(email.id); }} className="shrink-0">
                        <Star size={10} className={email.starred ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} />
                      </button>
                    </div>
                    <div className={`text-[10px] truncate mt-0.5 ${!email.read ? 'text-foreground' : 'text-muted-foreground'}`}>{email.subject}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] text-muted-foreground/60 truncate flex-1">{email.preview}</span>
                      <span className="text-[8px] text-muted-foreground/40 shrink-0">{email.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email detail */}
            {selectedEmail && selected && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto scrollbar-os">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{selected.avatar}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{selected.from}</div>
                    <div className="text-[10px] text-muted-foreground">{selected.time}</div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground"><Reply size={13} /></button>
                    <button className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground"><Forward size={13} /></button>
                    <button className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground"><Archive size={13} /></button>
                    <button className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-3">{selected.subject}</h3>
                <div className="text-xs text-muted-foreground leading-relaxed">{selected.preview}</div>
              </div>
            )}

            {!selectedEmail && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Select an email to read</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailClientApp;
