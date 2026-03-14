import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MODELS = [
  { id: 'google/gemini-3-flash-preview', label: 'Gemini Flash' },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini Lite' },
  { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano' },
];

export default function AIChatApp({ windowId }: { windowId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [streaming, setStreaming] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setStreaming('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          model,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const reply = data?.reply || data?.choices?.[0]?.message?.content || 'No response received.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errorMessage}` }]);
    } finally {
      setLoading(false);
      setStreaming('');
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/20 bg-secondary/10 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles size={14} className="text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-foreground">Scribe AI</div>
          <div className="text-[9px] text-muted-foreground">Powered by Lovable AI</div>
        </div>
        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          className="bg-muted/30 rounded px-2 py-0.5 text-[10px] text-foreground outline-none border border-border/20"
        >
          {MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <button onClick={clearChat} className="p-1 rounded hover:bg-muted/30 text-muted-foreground" title="Clear chat">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-os">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={28} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Scribe AI</span>
            <span className="text-xs text-center max-w-[240px]">Ask me anything — code, questions, creative writing, analysis...</span>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {['Write a Python function', 'Explain quantum computing', 'Debug this code', 'Create a poem'].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-2.5 py-1 rounded-full bg-muted/30 text-[10px] text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-primary/10' : 'bg-secondary/50'
            }`}>
              {msg.role === 'user' ? <User size={12} className="text-primary" /> : <Bot size={12} className="text-muted-foreground" />}
            </div>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted/40 text-foreground rounded-bl-sm'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-muted-foreground" />
            </div>
            <div className="bg-muted/40 px-3 py-2 rounded-xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border/20 bg-secondary/5">
        <div className="flex gap-2 items-end bg-muted/20 rounded-xl px-3 py-2 border border-border/20 focus-within:border-primary/30 transition-colors">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-xs text-foreground outline-none resize-none scrollbar-os placeholder:text-muted-foreground/50 min-h-[20px] max-h-[80px]"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-all shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
