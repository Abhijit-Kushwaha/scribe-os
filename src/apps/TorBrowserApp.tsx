import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, RefreshCw, Shield, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  url: string;
  title: string;
  htmlContent: string;
  loading: boolean;
}

interface CircuitNode {
  ip: string;
  country: string;
  flag: string;
}

const TorBrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      url: 'http://localhost:3000',
      title: 'New Tab',
      htmlContent: '',
      loading: false,
    },
  ]);
  const [activeTab, setActiveTab] = useState('1');
  const [urlInput, setUrlInput] = useState('http://localhost:3000');
  const [circuit, setCircuit] = useState<CircuitNode[]>([]);
  const [currentIP, setCurrentIP] = useState('Unknown');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = async (url: string) => {
    const res = await fetch(
      `http://localhost:3000/tor-fetch?url=${encodeURIComponent(url)}`
    );
    const html = await res.text();

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab
          ? { ...t, url, htmlContent: html, loading: false }
          : t
      )
    );
  };

  const rotateIP = async () => {
    await fetch('http://localhost:3000/rotate-ip', { method: 'POST' });
    fetchCircuit();
  };

  const fetchCircuit = async () => {
    const res = await fetch('http://localhost:3000/circuit');
    const data = await res.json();
    setCircuit(data.circuit || []);
    setCurrentIP(data.currentIP || 'Unknown');
  };

  const addTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: 'http://localhost:3000',
      title: 'New Tab',
      htmlContent: '',
      loading: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (id: string) => {
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id && newTabs.length > 0) {
      setActiveTab(newTabs[0].id);
    }
  };

  const handleNavigate = () => {
    navigate(urlInput);
  };

  useEffect(() => {
    fetchCircuit();
  }, []);

  useEffect(() => {
    const currentTab = tabs.find((t) => t.id === activeTab);
    if (currentTab) {
      setUrlInput(currentTab.url);
    }
  }, [activeTab, tabs]);

  const currentTab = tabs.find((t) => t.id === activeTab);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Circuit Info Bar */}
      <div className="bg-purple-900 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="text-sm">Current IP: {currentIP}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Circuit:</span>
          {circuit.map((node, i) => (
            <span key={i} className="text-xs">
              {node.flag} {node.country} ({node.ip})
              {i < circuit.length - 1 && ' → '}
            </span>
          ))}
        </div>
        <Button onClick={rotateIP} size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-1" />
          Rotate IP
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="bg-gray-800 flex items-center gap-1 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded cursor-pointer',
              activeTab === tab.id ? 'bg-gray-700' : 'bg-gray-600'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <Globe className="w-3 h-3" />
            <span className="text-sm truncate max-w-[120px]">
              {tab.title}
            </span>
            <X
              className="w-3 h-3 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            />
          </div>
        ))}
        <Button onClick={addTab} size="sm" variant="ghost">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Address Bar */}
      <div className="bg-gray-800 p-2 flex items-center gap-2">
        <Button size="sm" variant="ghost">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button onClick={handleNavigate} size="sm" variant="ghost">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
          className="flex-1 bg-gray-700 border-gray-600"
          placeholder="Enter URL..."
        />
      </div>

      {/* Browser Content */}
      <div className="flex-1 bg-white">
        {currentTab && (
          <iframe
            ref={iframeRef}
            srcDoc={currentTab.htmlContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title={currentTab.title}
          />
        )}
      </div>
    </div>
  );
};

export default TorBrowserApp;