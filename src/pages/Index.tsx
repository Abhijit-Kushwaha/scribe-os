import React, { useState, useCallback } from 'react';
import { OSProvider, useOS } from '@/os/OSContext';
import Desktop from '@/os/Desktop';
import BootScreen from '@/os/BootScreen';
import LockScreen from '@/os/LockScreen';

function OSContent() {
  const [booted, setBooted] = useState(false);
  const [locked, setLocked] = useState(true);
  const { settings } = useOS();
  const handleBootComplete = useCallback(() => setBooted(true), []);
  const handleUnlock = useCallback(() => setLocked(false), []);

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
      <OSContent />
    </OSProvider>
  );
};

export default Index;
