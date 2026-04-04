import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'notification';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showNotificationToast: (title: string, message: string) => void;
}

const NotificationToastContext = createContext<NotificationToastContextType | undefined>(undefined);

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success': return <CheckCircle size={18} className="text-green-400" />;
    case 'error': return <XCircle size={18} className="text-red-400" />;
    case 'warning': return <AlertTriangle size={18} className="text-orange-400" />;
    case 'notification': return <Bell size={18} className="text-[#C8FF00]" />;
    default: return <Info size={18} className="text-blue-400" />;
  }
};

const ToastColors: Record<ToastType, string> = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  warning: 'border-orange-500/30',
  info: 'border-blue-500/30',
  notification: 'border-[#C8FF00]/30',
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 bg-[#1a1a1a] border ${ToastColors[toast.type]} rounded-xl p-4 shadow-2xl min-w-[300px] max-w-[380px]`}
      style={{ animation: 'slideInRight 0.25s ease-out' }}
    >
      <div className="shrink-0 mt-0.5">
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-on-surface-variant hover:text-white transition-colors p-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const NotificationToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const showNotificationToast = useCallback((title: string, message: string) => {
    showToast({ type: 'notification', title, message, duration: 6000 });
  }, [showToast]);

  return (
    <NotificationToastContext.Provider value={{ showToast, showNotificationToast }}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </NotificationToastContext.Provider>
  );
};

export const useNotificationToast = () => {
  const ctx = useContext(NotificationToastContext);
  if (!ctx) throw new Error('useNotificationToast must be within NotificationToastProvider');
  return ctx;
};
