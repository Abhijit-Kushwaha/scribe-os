import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatApp({ windowId }: { windowId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const Bytez = (await import('bytez.js')).default;
      const sdk = new Bytez('2622dd06541127bea7641c3ad0ed8859');
      const model = sdk.model('deepseek-ai/deepseek-coder-1.3b-instruct');

      const { error, output } = await model.run(
        updated.map(m => ({ role: m.role, content: m.content }))
      );

      if (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error}` }]);
      } else {
        const reply = typeof output === 'string'
          ? output
          : Array.isArray(output)
            ? output.map((o: any) => o?.generated_text ?? o?.content ?? JSON.stringify(o)).join('')
            : JSON.stringify(output);
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 bg-secondary/20 flex items-center gap-2">
        <span className="text-sm">🤖</span>
        <span className="text-xs font-medium text-foreground">DeepSeek Coder AI</span>
        <span className="text-[10px] text-muted-foreground ml-auto">deepseek-coder-1.3b</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-os">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <span className="text-3xl">🤖</span>
            <span className="text-xs">Ask DeepSeek anything about code...</span>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted text-foreground rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground px-3 py-2 rounded-lg rounded-bl-sm text-xs">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border/30 bg-secondary/10 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask something..."
          className="flex-1 bg-muted/50 text-foreground text-xs px-3 py-2 rounded outline-none placeholder:text-muted-foreground"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-primary text-primary-foreground text-xs rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Send
        </button>
      </div>
    </div>
  );
}
