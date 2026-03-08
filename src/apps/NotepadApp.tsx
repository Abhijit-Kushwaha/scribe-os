import React, { useState } from 'react';

export default function NotepadApp() {
  const [content, setContent] = useState('Welcome to Scribe Notepad!\n\nStart typing here...');
  const [fileName, setFileName] = useState('untitled.txt');

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = content.split('\n').length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 border-b border-border/30 text-[11px] text-muted-foreground">
        <span>File:</span>
        <input
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          className="bg-transparent border-b border-border/30 px-1 text-foreground outline-none focus:border-primary transition-colors"
        />
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        className="flex-1 bg-transparent p-4 text-sm font-mono resize-none outline-none text-foreground scrollbar-os"
        spellCheck={false}
      />
      <div className="px-3 py-1 bg-secondary/20 border-t border-border/30 text-[10px] text-muted-foreground flex gap-4">
        <span>Lines: {lineCount}</span>
        <span>Words: {wordCount}</span>
        <span>Chars: {content.length}</span>
      </div>
    </div>
  );
}
