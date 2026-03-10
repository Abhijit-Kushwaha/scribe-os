import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, MemoryStick, Wifi, Clock, Thermometer } from 'lucide-react';

function useRandomMetric(min: number, max: number, interval = 1000) {
  const [value, setValue] = useState(min + Math.random() * (max - min));
  useEffect(() => {
    const t = setInterval(() => {
      setValue(prev => {
        const delta = (Math.random() - 0.5) * (max - min) * 0.1;
        return Math.max(min, Math.min(max, prev + delta));
      });
    }, interval);
    return () => clearInterval(t);
  }, [min, max, interval]);
  return value;
}

function MiniBar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  return (
    <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

export default function TaskManagerApp() {
  const cpu = useRandomMetric(10, 65);
  const memory = useRandomMetric(30, 70);
  const disk = useRandomMetric(5, 25, 2000);
  const network = useRandomMetric(0.5, 15);
  const temp = useRandomMetric(38, 62, 3000);

  const processes = [
    { name: 'window-manager', cpu: 2.1, mem: 45 },
    { name: 'terminal-sh', cpu: 0.8, mem: 12 },
    { name: 'file-system', cpu: 0.3, mem: 28 },
    { name: 'renderer', cpu: cpu * 0.15, mem: memory * 0.8 },
    { name: 'service-worker', cpu: 0.1, mem: 8 },
    { name: 'audio-engine', cpu: 0.5, mem: 15 },
    { name: 'network-stack', cpu: network * 0.1, mem: 22 },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-os p-4 text-xs">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { icon: <Cpu size={14} />, label: 'CPU', value: `${cpu.toFixed(1)}%`, metric: cpu, max: 100, color: 'bg-primary' },
          { icon: <MemoryStick size={14} />, label: 'Memory', value: `${memory.toFixed(0)}%`, metric: memory, max: 100, color: 'bg-accent' },
          { icon: <HardDrive size={14} />, label: 'Disk', value: `${disk.toFixed(1)} MB/s`, metric: disk, max: 50, color: 'bg-os-terminal-green' },
          { icon: <Wifi size={14} />, label: 'Network', value: `${network.toFixed(1)} Mbps`, metric: network, max: 20, color: 'bg-os-terminal-cyan' },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-lg bg-secondary/20">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">{item.icon} {item.label}</div>
            <div className="text-lg font-bold mb-1">{item.value}</div>
            <MiniBar value={item.metric} max={item.max} color={item.color} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4 text-muted-foreground">
        <span className="flex items-center gap-1"><Thermometer size={12} /> {temp.toFixed(0)}°C</span>
        <span className="flex items-center gap-1"><Clock size={12} /> Uptime: {Math.floor(performance.now() / 60000)}m</span>
      </div>

      <div className="font-medium mb-2 flex items-center gap-2"><Activity size={12} /> Processes</div>
      <div className="rounded-lg border border-border/20 overflow-hidden">
        <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-secondary/30 text-muted-foreground font-medium">
          <span>Name</span><span className="text-right">CPU %</span><span className="text-right">Mem MB</span>
        </div>
        {processes.map(p => (
          <div key={p.name} className="grid grid-cols-3 gap-2 px-3 py-1.5 hover:bg-muted/20 transition-colors">
            <span className="font-mono text-os-terminal-cyan">{p.name}</span>
            <span className="text-right">{p.cpu.toFixed(1)}</span>
            <span className="text-right">{p.mem.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
