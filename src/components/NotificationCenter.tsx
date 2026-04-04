import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, X, Calendar, DollarSign, Package, User, Scissors, Star } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification, NotificationType } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getIcon = (type: NotificationType) => {
  const iconProps = { size: 16 };
  switch (type) {
    case 'new_appointment':
    case 'appointment_confirmed':
    case 'appointment_reminder':
    case 'appointment_cancelled':
    case 'appointment_completed':
      return <Calendar {...iconProps} />;
    case 'payment_received':
      return <DollarSign {...iconProps} />;
    case 'stock_low':
      return <Package {...iconProps} />;
    case 'new_client':
      return <User {...iconProps} />;
    case 'barber_invite':
      return <Scissors {...iconProps} />;
    case 'system':
      return <Star {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
};

const getIconColor = (type: NotificationType): string => {
  switch (type) {
    case 'new_appointment':
    case 'appointment_confirmed':
    case 'appointment_completed':
      return '#C8FF00';
    case 'payment_received':
      return '#4CAF50';
    case 'stock_low':
    case 'appointment_reminder':
      return '#FF9800';
    case 'appointment_cancelled':
      return '#F44336';
    case 'new_client':
      return '#2196F3';
    case 'barber_invite':
      return '#9C27B0';
    default:
      return '#607D8B';
  }
};

const NotificationItem = ({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) => {
  const color = getIconColor(notification.type as NotificationType);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all group hover:bg-white/5 ${
        !notification.is_read ? 'bg-white/3 border border-white/10' : ''
      }`}
      onClick={() => !notification.is_read && onRead(notification.id)}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-[#C8FF00] shadow-[0_0_6px_rgba(200,255,0,0.6)]" />
      )}

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {getIcon(notification.type as NotificationType)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold leading-tight ${
            notification.is_read ? 'text-on-surface-variant' : 'text-white'
          }`}
        >
          {notification.title}
        </p>
        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <span className="text-[10px] text-on-surface-variant/60 mt-1 block">
          {timeAgo}
        </span>
      </div>
    </div>
  );
};

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Request browser notification permission on open
  useEffect(() => {
    if (isOpen && 'Notification' in window && (window.Notification as typeof Notification).permission === 'default') {
      (window.Notification as typeof Notification).requestPermission();
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        id="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative text-[#A0A0A0] hover:text-[#C8FF00] transition-colors p-1"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#C8FF00] text-[#0D0D0D] text-[9px] font-black rounded-full flex items-center justify-center px-0.5 shadow-[0_0_8px_rgba(200,255,0,0.5)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="notification-panel"
          className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-2rem)] bg-[#141414] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
          style={{ animation: 'slideDownFade 0.15s ease-out' }}
        >
          <style>{`
            @keyframes slideDownFade {
              from { opacity: 0; transform: translateY(-8px) scale(0.97); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Notificações</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-[#C8FF00]/20 text-[#C8FF00] px-2 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-[#C8FF00] transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Todas lidas</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-on-surface-variant hover:text-white transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#C8FF00]/30 border-t-[#C8FF00] rounded-full animate-spin" />
                <p className="text-sm text-on-surface-variant">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <Bell size={24} className="text-on-surface-variant" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-on-surface-variant">
                    Tudo em dia!
                  </p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    Nenhuma notificação no momento.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((n: Notification) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={markAsRead}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10 bg-surface-container-lowest">
              <p className="text-[10px] text-on-surface-variant text-center">
                Mostrando as últimas {notifications.length} notificações
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
