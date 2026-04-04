import { useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Trash2, Calendar, DollarSign, Package, Star, UserPlus, AlertTriangle, ShoppingBag, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotifications, type Notification } from '../../contexts/NotificationContext';

// Mapa de ícone + cor por tipo de notificação
const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  NOVO_AGENDAMENTO:      { icon: <Calendar size={16} />,      color: 'text-[#C8FF00]',   bg: 'bg-[#C8FF00]/10' },
  AGENDAMENTO_RECEBIDO:  { icon: <Clock size={16} />,         color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  AGENDAMENTO_CONFIRMADO:{ icon: <Calendar size={16} />,      color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ATENDIMENTO_INICIADO:  { icon: <Clock size={16} />,         color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
  AGENDAMENTO_CONCLUIDO: { icon: <CheckCheck size={16} />,    color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  AGENDAMENTO_CANCELADO: { icon: <X size={16} />,             color: 'text-red-400',     bg: 'bg-red-400/10' },
  CLIENTE_AUSENTE:       { icon: <AlertTriangle size={16} />, color: 'text-orange-400',  bg: 'bg-orange-400/10' },
  PAGAMENTO_RECEBIDO:    { icon: <DollarSign size={16} />,    color: 'text-[#C8FF00]',   bg: 'bg-[#C8FF00]/10' },
  COMISSAO_PAGA:         { icon: <DollarSign size={16} />,    color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  NOVO_CLIENTE:          { icon: <UserPlus size={16} />,      color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  ESTOQUE_BAIXO:         { icon: <Package size={16} />,       color: 'text-orange-400',  bg: 'bg-orange-400/10' },
  NOVA_AVALIACAO:        { icon: <Star size={16} />,          color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
};

const DEFAULT_META = { icon: <Bell size={16} />, color: 'text-white/60', bg: 'bg-white/5' };

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? DEFAULT_META;
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
}

const NotificationItem = ({ notification, onRead, onRemove }: NotificationItemProps) => {
  const meta = getTypeMeta(notification.type);

  return (
    <div
      onClick={() => !notification.read && onRead(notification.id)}
      className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200
        ${notification.read
          ? 'opacity-60 hover:opacity-80'
          : 'bg-white/[0.03] hover:bg-white/[0.06]'}
        border-b border-white/5 last:border-0`}
    >
      {/* Dot unread */}
      {!notification.read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />
      )}

      {/* Icon */}
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color} mt-0.5`}>
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">{notification.title}</p>
        <p className="text-xs text-on-surface-variant mt-0.5 leading-snug line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-white/30 font-medium mt-1.5 uppercase tracking-wide">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(notification.id); }}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all mt-0.5"
        title="Remover"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};

// ─── Painel Principal ──────────────────────────────────────────────────────────
const NotificationPanel = () => {
  const { notifications, unreadCount, loading, panelOpen, setPanelOpen, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen, setPanelOpen]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setPanelOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200
          ${panelOpen ? 'text-[#C8FF00] bg-[#C8FF00]/10' : 'text-[#A0A0A0] hover:text-[#C8FF00] hover:bg-white/5'}`}
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#C8FF00] text-[#1a1a00] text-[9px] font-black rounded-full leading-none shadow-[0_0_8px_rgba(200,255,0,0.6)] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {panelOpen && (
        <div className="absolute right-0 top-full mt-3 w-[360px] max-w-[calc(100vw-2rem)] bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[rgba(200,255,0,0.02)]">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#C8FF00]" />
              <h3 className="text-sm font-black text-white">Notificações</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#C8FF00]/15 text-[#C8FF00] text-[10px] font-black rounded-full">
                  {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-[#C8FF00]/70 hover:text-[#C8FF00] transition-colors uppercase tracking-wider"
                >
                  <CheckCheck size={13} />
                  Marcar todas
                </button>
              )}
              <button onClick={() => setPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[420px] custom-scrollbar">
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/5 rounded-full w-3/4" />
                      <div className="h-2.5 bg-white/5 rounded-full w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Bell size={28} className="text-white/20" />
                </div>
                <p className="text-sm font-bold text-white/40">Nenhuma notificação</p>
                <p className="text-xs text-white/20 mt-1">Você está em dia! ✨</p>
              </div>
            ) : (
              <>
                {/* Não lidas */}
                {notifications.filter((n) => !n.read).length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/[0.02]">
                      Não lidas
                    </p>
                    {notifications.filter((n) => !n.read).map((n) => (
                      <NotificationItem key={n.id} notification={n} onRead={markAsRead} onRemove={removeNotification} />
                    ))}
                  </div>
                )}
                {/* Lidas */}
                {notifications.filter((n) => n.read).length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/[0.01]">
                      Anteriores
                    </p>
                    {notifications.filter((n) => n.read).slice(0, 20).map((n) => (
                      <NotificationItem key={n.id} notification={n} onRead={markAsRead} onRemove={removeNotification} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-white/5 bg-[rgba(26,25,25,0.5)]">
              <p className="text-[10px] text-white/20 text-center">
                {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} no total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

// Re-export para uso no CustomerArea
export { NotificationItem, getTypeMeta, timeAgo };
export type { NotificationItemProps };
