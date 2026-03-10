import { useState, useCallback, useEffect } from 'react';
import { FileNode } from './types';

const DEFAULT_FS: FileNode = {
  name: 'C:', type: 'folder', children: [
    { name: 'Users', type: 'folder', children: [
      { name: 'Scribe', type: 'folder', children: [
        { name: 'Desktop', type: 'folder', children: [
          { name: 'readme.txt', type: 'file', content: 'Welcome to Scribe OS!\n\nThis is your desktop environment running entirely in the browser.\nFeel free to explore the apps and features.', size: 142 },
        ]},
        { name: 'Documents', type: 'folder', children: [
          { name: 'notes.txt', type: 'file', content: 'My notes go here...', size: 20 },
          { name: 'todo.md', type: 'file', content: '# TODO\n- [ ] Hack the planet\n- [ ] Learn Rust\n- [x] Build Scribe OS', size: 65 },
        ]},
        { name: 'Downloads', type: 'folder', children: [] },
        { name: 'Pictures', type: 'folder', children: [] },
      ]},
    ]},
    { name: 'System', type: 'folder', children: [
      { name: 'config.sys', type: 'file', content: 'SCRIBE_OS=1.0\nKERNEL=browser\nARCH=wasm64', size: 40 },
      { name: 'boot.log', type: 'file', content: '[OK] Kernel loaded\n[OK] Virtual FS mounted\n[OK] Window manager ready\n[OK] Scribe OS v1.0 booted', size: 90 },
    ]},
  ]
};

export function useFileSystem() {
  const [fs, setFs] = useState<FileNode>(() => {
    try {
      const saved = localStorage.getItem('scribe-fs');
      return saved ? JSON.parse(saved) : DEFAULT_FS;
    } catch { return DEFAULT_FS; }
  });

  useEffect(() => {
    localStorage.setItem('scribe-fs', JSON.stringify(fs));
  }, [fs]);

  const getNode = useCallback((path: string): FileNode | null => {
    const parts = path.split('/').filter(Boolean);
    let node = fs;
    for (const part of parts) {
      if (part === fs.name) continue;
      const child = node.children?.find(c => c.name === part);
      if (!child) return null;
      node = child;
    }
    return node;
  }, [fs]);

  const writeFile = useCallback((path: string, content: string) => {
    setFs(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = path.split('/').filter(Boolean);
      const fileName = parts.pop()!;
      let node = clone;
      for (const part of parts) {
        if (part === clone.name) continue;
        node = node.children?.find((c: FileNode) => c.name === part) || node;
      }
      const existing = node.children?.find((c: FileNode) => c.name === fileName);
      if (existing) {
        existing.content = content;
        existing.modified = Date.now();
        existing.size = content.length;
      } else {
        node.children = node.children || [];
        node.children.push({ name: fileName, type: 'file', content, modified: Date.now(), size: content.length });
      }
      return clone;
    });
  }, []);

  const createFolder = useCallback((path: string, name: string) => {
    setFs(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = path.split('/').filter(Boolean);
      let node = clone;
      for (const part of parts) {
        if (part === clone.name) continue;
        node = node.children?.find((c: FileNode) => c.name === part) || node;
      }
      node.children = node.children || [];
      if (!node.children.find((c: FileNode) => c.name === name)) {
        node.children.push({ name, type: 'folder', children: [] });
      }
      return clone;
    });
  }, []);

  const deleteNode = useCallback((path: string) => {
    setFs(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = path.split('/').filter(Boolean);
      const nodeName = parts.pop()!;
      let parent = clone;
      for (const part of parts) {
        if (part === clone.name) continue;
        parent = parent.children?.find((c: FileNode) => c.name === part) || parent;
      }
      parent.children = parent.children?.filter((c: FileNode) => c.name !== nodeName) || [];
      return clone;
    });
  }, []);

  return { fs, getNode, writeFile, createFolder, deleteNode };
}
