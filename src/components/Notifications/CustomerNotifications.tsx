import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Trash2, Calendar, Clock, CheckCircle, XCircle, Star, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotifications, type Notification } from '../../contexts/NotificationContext';

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  AGENDAMENTO_RECEBIDO:   { icon: <Clock size={18} />,        color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20' },
  AGENDAMENTO_CONFIRMADO: { icon: <CheckCircle size={18} />,  color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  ATENDIMENTO_INICIADO:   { icon: <Clock size={18} />,        color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20' },
  AGENDAMENTO_CONCLUIDO:  { icon: <CheckCircle size={18} />,  color: 'text-[#C8FF00]',   bg: 'bg-[#C8FF00]/10',   border: 'border-[#C8FF00]/20' },
  AGENDAMENTO_CANCELADO:  { icon: <XCircle size={18} />,      color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20' },
  NOVA_AVALIACAO:         { icon: <Star size={18} />,         color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20' },
};
const DEFAULT_META = {
  icon: <Bell size={18} />, color: 'text-white/50',
  bg: 'bg-white/5', border: 'border-white/10'
};

function getTypeMeta(type: string) { return TYPE_META[type] ?? DEFAULT_META; }
function timeAgo(dateStr: string) {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR }); }
  catch { return ''; }
}

// ─── Toast de notificação (aparece no topo) ────────────────────────────────────
export const NotificationToast = ({ notification, onClose }: { notification: Notification; onClose: () => void }) => {
  const meta = getTypeMeta(notification.type);
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100vw-2rem)] max-w-sm
      bg-[#0D0D0D] border ${meta.border} rounded-2xl shadow-2xl px-4 py-3.5
      flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300`}>
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{notification.title}</p>
        <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{notification.message}</p>
      </div>
      <button onClick={onClose} className="shrink-0 p-1 rounded-lg text-white/30 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Gaveta de Notificações do Cliente ─────────────────────────────────────────
const CustomerNotifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);
  const lastCountRef = useRef(unreadCount);

  // Mostra toast ao receber nova notificação
  useEffect(() => {
    if (unreadCount > lastCountRef.current && notifications.length > 0) {
      const newest = notifications.find((n) => !n.read);
      if (newest) setToast(newest);
    }
    lastCountRef.current = unreadCount;
  }, [unreadCount, notifications]);

  return (
    <>
      {/* Toast */}
      {toast && <NotificationToast notification={toast} onClose={() => setToast(null)} />}

      {/* Botão sino */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="relative p-2 rounded-xl text-white/60 hover:text-[#C8FF00] hover:bg-white/5 transition-all"
        aria-label="Notificações"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#C8FF00] text-[#1a1a00] text-[9px] font-black rounded-full shadow-[0_0_8px_rgba(200,255,0,0.5)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Overlay + Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />

          {/* Drawer slide from bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-white/10 rounded-t-3xl max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-[#C8FF00]" />
                <h3 className="text-base font-black text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#C8FF00]/15 text-[#C8FF00] text-[10px] font-black rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="flex items-center gap-1 text-[11px] text-[#C8FF00]/70 hover:text-[#C8FF00] font-bold">
                    <CheckCheck size={14} /> Marcar todas
                  </button>
                )}
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-xl bg-white/5 text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col gap-3 p-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3.5 bg-white/5 rounded-full w-2/3" />
                        <div className="h-2.5 bg-white/5 rounded-full w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-5">
                    <Bell size={32} className="text-white/15" />
                  </div>
                  <p className="text-base font-bold text-white/40">Tudo em dia!</p>
                  <p className="text-sm text-white/20 mt-1">Nenhuma notificação por aqui.</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {notifications.map((notification) => {
                    const meta = getTypeMeta(notification.type);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                        className={`group relative flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all
                          ${notification.read
                            ? 'bg-white/[0.02] opacity-60'
                            : `border ${meta.border} bg-white/[0.04] hover:bg-white/[0.06]`}`}
                      >
                        {!notification.read && (
                          <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#C8FF00]" />
                        )}
                        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-bold text-white leading-tight">{notification.title}</p>
                          <p className="text-xs text-white/50 mt-1 leading-relaxed">{notification.message}</p>
                          <p className="text-[10px] text-white/25 mt-2 uppercase tracking-wide font-medium">
                            {timeAgo(notification.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Safe area bottom padding */}
            <div className="pb-[env(safe-area-inset-bottom,16px)]" />
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerNotifications;
