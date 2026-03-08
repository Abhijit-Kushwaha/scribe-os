import React from 'react';
import { OSProvider } from '@/os/OSContext';
import Desktop from '@/os/Desktop';

const Index = () => {
  return (
    <OSProvider>
      <Desktop />
    </OSProvider>
  );
};

export default Index;
