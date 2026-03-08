import React, { useState, useCallback } from 'react';
import { OSProvider, useOS } from '@/os/OSContext';
import { NotificationProvider } from '@/os/NotificationSystem';
import Desktop from '@/os/Desktop';
import BootScreen from '@/os/BootScreen';
import LockScreen from '@/os/LockScreen';

function OSContent() {
  const [booted, setBooted] = useState(false);
  const [locked, setLocked] = useState(true);
  const [shutdown, setShutdown] = useState(false);
  const { settings } = useOS();
  const handleBootComplete = useCallback(() => setBooted(true), []);
  const handleUnlock = useCallback(() => setLocked(false), []);

  if (shutdown) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="text-foreground text-sm mb-2">Shutting down...</div>
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <>
      {!booted && <BootScreen onComplete={handleBootComplete} />}
      {booted && locked && <LockScreen onUnlock={handleUnlock} username={settings.username} />}
      <Desktop />
    </>
  );
}

const Index = () => {
  return (
    <OSProvider>
      <NotificationProvider>
        <OSContent />
      </NotificationProvider>
    </OSProvider>
  );
};

export default Index;
