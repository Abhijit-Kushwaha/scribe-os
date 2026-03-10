import React, { useState } from 'react';

interface Props {
  icon: string;
  label: string;
  onClick: () => void;
}

export default function DesktopIcon({ icon, label, onClick }: Props) {
  const [selected, setSelected] = useState(false);

  return (
    <button
      className={`flex flex-col items-center gap-0.5 w-[76px] p-1.5 rounded-lg transition-all group ${
        selected ? 'bg-primary/15 ring-1 ring-primary/30' : 'hover:bg-foreground/10'
      }`}
      onClick={() => setSelected(!selected)}
      onDoubleClick={onClick}
      onBlur={() => setSelected(false)}
    >
      <span className="text-2xl group-hover:scale-110 transition-transform drop-shadow-lg">{icon}</span>
      <span className="text-[10px] text-foreground/90 text-center leading-tight drop-shadow-md line-clamp-2 w-full">{label}</span>
    </button>
  );
}
