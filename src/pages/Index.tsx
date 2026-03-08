import React, { useState, useCallback } from 'react';
import { OSProvider } from '@/os/OSContext';
import Desktop from '@/os/Desktop';
import BootScreen from '@/os/BootScreen';
import LockScreen from '@/os/LockScreen';

const Index = () => {
  const [booted, setBooted] = useState(false);
  const [locked, setLocked] = useState(true);
  const handleBootComplete = useCallback(() => setBooted(true), []);
  const handleUnlock = useCallback(() => setLocked(false), []);

  return (
    <OSProvider>
      {!booted && <BootScreen onComplete={handleBootComplete} />}
      {booted && locked && <LockScreen onUnlock={handleUnlock} />}
      <Desktop />
    </OSProvider>
  );
};

export default Index;
