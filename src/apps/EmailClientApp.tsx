import React, { useState } from 'react';
import { Mail, Send, Inbox, Star, Trash2, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ComposeEmail {
  to: string;
  subject: string;
  body: string;
}

const EmailClientApp: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('compose');
  const [compose, setCompose] = useState<ComposeEmail>({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        body: {
          to: compose.to,
          subject: compose.subject,
          body: compose.body,
        },
      });

      if (error) throw new Error(error.message);

      if (data?.error) {
        setStatus({ type: 'error', message: data.error });
      } else {
        setStatus({ type: 'success', message: 'Email sent successfully!' });
        setCompose({ to: '', subject: '', body: '' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const folders = [
    { id: 'compose', name: 'Compose', icon: Send, count: 0 },
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: 0 },
    { id: 'starred', name: 'Starred', icon: Star, count: 0 },
    { id: 'trash', name: 'Trash', icon: Trash2, count: 0 },
  ];

  return (
    <div className="h-full flex bg-[#1a1a2e] text-white">
      {/* Sidebar */}
      <div className="w-56 bg-[#16162a] border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div className="font-medium">Email Client</div>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFolder === folder.id
                  ? 'bg-purple-600/30 text-purple-300'
                  : 'text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              <folder.icon className="w-4 h-4" />
              {folder.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeFolder === 'compose' ? (
          <form onSubmit={handleSendEmail} className="flex-1 flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Compose Email
            </h2>

            {status && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                status.type === 'success' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
              }`}>
                {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {status.message}
              </div>
            )}

            <div className="space-y-3 flex-1">
              <div>
                <label className="block text-gray-400 text-sm mb-1">To</label>
                <input
                  type="email"
                  value={compose.to}
                  onChange={(e) => setCompose({ ...compose, to: e.target.value })}
                  placeholder="recipient@email.com"
                  className="w-full bg-[#252542] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Subject</label>
                <input
                  type="text"
                  value={compose.subject}
                  onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
                  placeholder="Email subject"
                  className="w-full bg-[#252542] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="block text-gray-400 text-sm mb-1">Message</label>
                <textarea
                  value={compose.body}
                  onChange={(e) => setCompose({ ...compose, body: e.target.value })}
                  placeholder="Write your message..."
                  className="w-full h-48 bg-[#252542] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  required
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={sending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
              <span className="text-xs text-gray-500">Sent via Resend • from onboarding@resend.dev</span>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Inbox className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No emails in {activeFolder}</p>
              <p className="text-sm mt-2">Inbox sync coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailClientApp;
