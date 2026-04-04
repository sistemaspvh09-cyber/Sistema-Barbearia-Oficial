import { useState } from 'react';
import { Bell, Calendar, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { useNotifications, type Notification, type NotificationType } from '../../hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'new_appointment':
    case 'appointment_confirmed':
    case 'appointment_reminder':
      return <Calendar size={20} className="text-[#C8FF00]" />;
    case 'appointment_cancelled':
      return <XCircle size={20} className="text-red-400" />;
    case 'appointment_completed':
      return <CheckCircle size={20} className="text-green-400" />;
    default:
      return <Bell size={20} className="text-blue-400" />;
  }
};

const getBgColor = (type: NotificationType, isRead: boolean) => {
  if (isRead) return 'bg-transparent';
  switch (type) {
    case 'appointment_cancelled': return 'bg-red-500/5';
    case 'appointment_completed': return 'bg-green-500/5';
    case 'appointment_confirmed':
    case 'new_appointment':
    case 'appointment_reminder': return 'bg-[#C8FF00]/5';
    default: return 'bg-blue-500/5';
  }
};

const CustomerNotificationItem = ({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const dateFormatted = format(new Date(notification.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR });

  return (
    <div
      className={`flex items-start gap-4 p-5 rounded-2xl transition-all cursor-pointer border border-white/5 ${getBgColor(notification.type, notification.is_read)}`}
      onClick={() => !notification.is_read && onRead(notification.id)}
    >
      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-bold ${notification.is_read ? 'text-on-surface-variant' : 'text-white'}`}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#C8FF00] shrink-0 mt-1.5 shadow-[0_0_6px_rgba(200,255,0,0.6)]" />
          )}
        </div>
        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[11px] text-on-surface-variant/60 mt-2 flex items-center gap-1">
          <Clock size={10} />
          {dateFormatted} · {timeAgo}
        </p>
      </div>
    </div>
  );
};

const CustomerNotifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="py-6 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-on-surface-variant mt-1">
              {unreadCount} notificação{unreadCount > 1 ? 'ões' : ''} não lida{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-[#C8FF00] hover:underline flex items-center gap-1"
          >
            <CheckCircle size={14} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-container p-1 rounded-xl">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            filter === 'all' ? 'bg-[#C8FF00] text-[#0d0d0d]' : 'text-on-surface-variant hover:text-white'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            filter === 'unread' ? 'bg-[#C8FF00] text-[#0d0d0d]' : 'text-on-surface-variant hover:text-white'
          }`}
        >
          Não lidas ({unreadCount})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#C8FF00]/30 border-t-[#C8FF00] rounded-full animate-spin" />
          <p className="text-on-surface-variant">Carregando notificações...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center">
            <Bell size={32} className="text-on-surface-variant" />
          </div>
          <div>
            <p className="text-base font-semibold text-on-surface-variant">
              {filter === 'unread' ? 'Tudo lido!' : 'Nenhuma notificação'}
            </p>
            <p className="text-sm text-on-surface-variant/60 mt-1">
              {filter === 'unread' 
                ? 'Você não tem notificações novas.' 
                : 'As suas notificações aparecerão aqui.'}
            </p>
          </div>
          {filter === 'unread' && notifications.length > 0 && (
            <button
              onClick={() => setFilter('all')}
              className="flex items-center gap-1 text-[#C8FF00] text-sm font-bold hover:underline"
            >
              Ver todas <ChevronRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(n => (
            <CustomerNotificationItem key={n.id} notification={n} onRead={markAsRead} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerNotifications;
