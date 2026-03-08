import React, { useState, useCallback } from 'react';
import { OSProvider } from '@/os/OSContext';
import Desktop from '@/os/Desktop';
import BootScreen from '@/os/BootScreen';

const Index = () => {
  const [booted, setBooted] = useState(false);
  const handleBootComplete = useCallback(() => setBooted(true), []);

  return (
    <OSProvider>
      {!booted && <BootScreen onComplete={handleBootComplete} />}
      <Desktop />
    </OSProvider>
  );
};

export default Index;
