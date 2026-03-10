import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';

export interface OSNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  duration?: number;
  timestamp: number;
}

interface NotificationContextType {
  notifications: OSNotification[];
  notify: (n: Omit<OSNotification, 'id' | 'timestamp'>) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  history: OSNotification[];
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be within NotificationProvider');
  return ctx;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TYPE_CONFIG = {
  info: { icon: <Info size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  success: { icon: <CheckCircle size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  warning: { icon: <AlertTriangle size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  error: { icon: <AlertTriangle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<OSNotification[]>([]);
  const [history, setHistory] = useState<OSNotification[]>([]);

  const notify = useCallback((n: Omit<OSNotification, 'id' | 'timestamp'>) => {
    const notif: OSNotification = { ...n, id: uid(), timestamp: Date.now() };
    setNotifications(prev => [...prev, notif]);
    setHistory(prev => [notif, ...prev].slice(0, 50));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  // Auto-dismiss
  useEffect(() => {
    const timers = notifications.map(n => {
      const dur = n.duration ?? 4000;
      return setTimeout(() => dismiss(n.id), dur);
    });
    return () => timers.forEach(clearTimeout);
  }, [notifications, dismiss]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss, clearAll, history }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[99997] flex flex-col gap-2 w-80 pointer-events-none">
        {notifications.map((n, i) => {
          const cfg = TYPE_CONFIG[n.type];
          return (
            <div
              key={n.id}
              className={`pointer-events-auto ${cfg.bg} ${cfg.border} border backdrop-blur-xl rounded-lg p-3 shadow-2xl animate-slide-in-right flex gap-3 items-start`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`${cfg.color} mt-0.5 shrink-0`}>
                {n.icon ? <span className="text-sm">{n.icon}</span> : cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground">{n.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</div>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}
