import React from 'react';
import { Monitor, Cpu, HardDrive, Wifi, Shield, Palette } from 'lucide-react';

export default function SettingsApp() {
  const info = [
    { icon: <Monitor size={16} />, label: 'Display', value: `${window.innerWidth}×${window.innerHeight}` },
    { icon: <Cpu size={16} />, label: 'Processor', value: `${navigator.hardwareConcurrency || 4} vCPU cores` },
    { icon: <HardDrive size={16} />, label: 'Storage', value: 'IndexedDB + localStorage' },
    { icon: <Wifi size={16} />, label: 'Network', value: navigator.onLine ? 'Connected' : 'Offline' },
    { icon: <Shield size={16} />, label: 'Security', value: 'Sandboxed' },
    { icon: <Palette size={16} />, label: 'Theme', value: 'Cyber Dark' },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-os p-4">
      <h2 className="text-sm font-semibold mb-1">System Settings</h2>
      <p className="text-xs text-muted-foreground mb-4">Scribe OS v1.0</p>

      <div className="space-y-2">
        {info.map(item => (
          <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <div className="text-primary">{item.icon}</div>
            <div className="flex-1">
              <div className="text-xs font-medium">{item.label}</div>
              <div className="text-[11px] text-muted-foreground">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <div className="text-xs font-medium text-primary mb-1">About Scribe OS</div>
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          A browser-native operating system simulator built with React. Features virtual file system,
          terminal emulator, window management, and more — all running entirely in your browser.
        </div>
      </div>
    </div>
  );
}
