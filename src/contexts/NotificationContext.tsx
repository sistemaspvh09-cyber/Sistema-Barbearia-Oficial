import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  userId: string;
  barbershopId: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const internalUserId = useRef<string | null>(null);

  const getInternalUserId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    if (internalUserId.current) return internalUserId.current;
    const { data } = await supabase
      .from('User')
      .select('id')
      .eq('authId', user.id)
      .single();
    internalUserId.current = data?.id ?? null;
    return internalUserId.current;
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    const userId = await getInternalUserId();
    if (!userId) { setNotifications([]); setLoading(false); return; }

    const { data } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(60);

    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [getInternalUserId]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      internalUserId.current = null;
      fetchNotifications();
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [user, fetchNotifications]);

  // Supabase Realtime — escuta inserções/atualizações em tempo real
  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel>;

    getInternalUserId().then((userId) => {
      if (!userId) return;

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Notification',
            filter: `userId=eq.${userId}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Notification',
            filter: `userId=eq.${userId}`,
          },
          (payload) => {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'Notification',
            filter: `userId=eq.${userId}`,
          },
          (payload) => {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, getInternalUserId]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('Notification').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('Notification').update({ read: true }).in('id', unreadIds);
  };

  const removeNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from('Notification').delete().eq('id', id);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        panelOpen,
        setPanelOpen,
        markAsRead,
        markAllAsRead,
        removeNotification,
        refetch: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
