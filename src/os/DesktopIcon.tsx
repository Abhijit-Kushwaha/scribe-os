import React from 'react';

interface Props {
  icon: string;
  label: string;
  onClick: () => void;
}

export default function DesktopIcon({ icon, label, onClick }: Props) {
  return (
    <button
      className="flex flex-col items-center gap-1 w-20 p-2 rounded-lg hover:bg-foreground/10 transition-colors group"
      onDoubleClick={onClick}
    >
      <span className="text-3xl group-hover:scale-110 transition-transform drop-shadow-lg">{icon}</span>
      <span className="text-[11px] text-foreground/90 text-center leading-tight drop-shadow-md truncate w-full">{label}</span>
    </button>
  );
}
