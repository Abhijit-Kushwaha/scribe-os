import React, { useState, useMemo } from 'react';
import { User, Search, Plus, Mail, Phone, MapPin, Trash2, Edit2, Star, Users } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatar: string;
  starred: boolean;
  group: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const DEMO_CONTACTS: Contact[] = [
  { id: uid(), name: 'Alice Chen', email: 'alice@proton.me', phone: '+1 555-0101', company: 'CyberCore Inc', avatar: '👩‍💻', starred: true, group: 'Work' },
  { id: uid(), name: 'Bob Martinez', email: 'bob.m@gmail.com', phone: '+1 555-0102', company: 'NetSec Labs', avatar: '👨‍🔬', starred: false, group: 'Work' },
  { id: uid(), name: 'Charlie Kim', email: 'charlie.k@outlook.com', phone: '+44 7700 900001', company: '', avatar: '🧑‍🎨', starred: true, group: 'Friends' },
  { id: uid(), name: 'Diana Patel', email: 'diana@proton.me', phone: '+91 98765 43210', company: 'CloudSec', avatar: '👩‍💼', starred: false, group: 'Work' },
  { id: uid(), name: 'Eve Johnson', email: 'eve.j@icloud.com', phone: '+1 555-0105', company: '', avatar: '👩‍🎤', starred: false, group: 'Friends' },
  { id: uid(), name: 'Frank Wilson', email: 'frank@tutanota.com', phone: '+49 170 1234567', company: 'InfoSec GmbH', avatar: '🧔', starred: true, group: 'Work' },
  { id: uid(), name: 'Grace Lee', email: 'grace.lee@pm.me', phone: '+82 10-1234-5678', company: 'DataStream', avatar: '👩', starred: false, group: 'Family' },
  { id: uid(), name: 'Henry Brown', email: 'henry.b@yahoo.com', phone: '+1 555-0108', company: '', avatar: '👴', starred: false, group: 'Family' },
];

const GROUPS = ['All', 'Work', 'Friends', 'Family'];

export default function ContactsApp({ windowId }: { windowId: string }) {
  const [contacts, setContacts] = useState<Contact[]>(DEMO_CONTACTS);
  const [selected, setSelected] = useState<string | null>(contacts[0]?.id || null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('All');
  const [editing, setEditing] = useState(false);

  const filtered = useMemo(() => {
    let list = contacts;
    if (group !== 'All') list = list.filter(c => c.group === group);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0) || a.name.localeCompare(b.name));
  }, [contacts, search, group]);

  const sel = contacts.find(c => c.id === selected);

  const addContact = () => {
    const c: Contact = { id: uid(), name: 'New Contact', email: '', phone: '', company: '', avatar: '👤', starred: false, group: 'Friends' };
    setContacts(prev => [c, ...prev]);
    setSelected(c.id);
    setEditing(true);
  };

  const update = (id: string, upd: Partial<Contact>) => setContacts(prev => prev.map(c => c.id === id ? { ...c, ...upd } : c));
  const remove = (id: string) => { setContacts(prev => prev.filter(c => c.id !== id)); if (selected === id) setSelected(null); };

  // Group contacts by first letter
  const grouped = useMemo(() => {
    const map = new Map<string, Contact[]>();
    filtered.forEach(c => {
      const letter = c.name[0]?.toUpperCase() || '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(c);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="h-full flex bg-[hsl(var(--os-window-body))]">
      {/* Sidebar */}
      <div className="w-56 border-r border-border/20 flex flex-col shrink-0">
        <div className="p-2 border-b border-border/10">
          <div className="flex items-center gap-1 mb-2">
            <div className="flex-1 flex items-center gap-1 bg-muted/30 rounded px-2 py-1">
              <Search size={10} className="text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-[10px] outline-none text-foreground" />
            </div>
            <button onClick={addContact} className="p-1 rounded hover:bg-muted/40 text-primary"><Plus size={14} /></button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {GROUPS.map(g => (
              <button key={g} onClick={() => setGroup(g)}
                className={`px-2 py-0.5 rounded text-[9px] whitespace-nowrap ${group === g ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'}`}>{g}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-os">
          {grouped.map(([letter, cs]) => (
            <div key={letter}>
              <div className="sticky top-0 px-3 py-1 text-[9px] font-bold text-primary bg-secondary/20">{letter}</div>
              {cs.map(c => (
                <button key={c.id} onClick={() => { setSelected(c.id); setEditing(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors ${selected === c.id ? 'bg-primary/10' : ''}`}>
                  <span className="text-lg">{c.avatar}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[11px] text-foreground truncate">{c.name}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{c.company || c.email}</div>
                  </div>
                  {c.starred && <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground text-xs">No contacts found</div>}
        </div>
        <div className="px-3 py-1.5 text-[9px] text-muted-foreground border-t border-border/10">
          <Users size={9} className="inline mr-1" />{contacts.length} contacts
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col">
        {sel ? (
          <div className="flex-1 p-4 overflow-y-auto scrollbar-os">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-secondary/40 flex items-center justify-center text-3xl border-2 border-border/20">{sel.avatar}</div>
              <div className="flex-1">
                {editing ? (
                  <input value={sel.name} onChange={e => update(sel.id, { name: e.target.value })} className="text-lg font-bold text-foreground bg-transparent border-b border-primary/30 outline-none w-full" />
                ) : (
                  <div className="text-lg font-bold text-foreground">{sel.name}</div>
                )}
                <div className="text-xs text-muted-foreground mt-0.5">{sel.group}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => update(sel.id, { starred: !sel.starred })}
                  className={`p-1.5 rounded hover:bg-muted/30 ${sel.starred ? 'text-yellow-400' : 'text-muted-foreground'}`}><Star size={14} /></button>
                <button onClick={() => setEditing(!editing)}
                  className={`p-1.5 rounded hover:bg-muted/30 ${editing ? 'text-primary' : 'text-muted-foreground'}`}><Edit2 size={14} /></button>
                <button onClick={() => remove(sel.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: <Mail size={14} />, label: 'Email', field: 'email' as const, value: sel.email },
                { icon: <Phone size={14} />, label: 'Phone', field: 'phone' as const, value: sel.phone },
                { icon: <MapPin size={14} />, label: 'Company', field: 'company' as const, value: sel.company },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10">
                  <div className="text-primary">{f.icon}</div>
                  <div className="flex-1">
                    <div className="text-[9px] text-muted-foreground">{f.label}</div>
                    {editing ? (
                      <input value={f.value} onChange={e => update(sel.id, { [f.field]: e.target.value })} className="text-xs text-foreground bg-transparent border-b border-border/30 outline-none w-full" />
                    ) : (
                      <div className="text-xs text-foreground">{f.value || '—'}</div>
                    )}
                  </div>
                </div>
              ))}

              {editing && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10">
                  <Users size={14} className="text-primary" />
                  <div className="flex-1">
                    <div className="text-[9px] text-muted-foreground">Group</div>
                    <select value={sel.group} onChange={e => update(sel.id, { group: e.target.value })}
                      className="text-xs text-foreground bg-transparent outline-none">
                      {GROUPS.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <User size={32} className="mx-auto mb-2 opacity-30" />
              <div className="text-xs">Select a contact</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
