import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Notification {
  id: string;
  created_at: string;
  salon_id: string | null;
  recipient_id: string;
  recipient_role: 'admin' | 'barbeiro' | 'client';
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  appointment_id: string | null;
}

export type NotificationType =
  | 'new_appointment'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'payment_received'
  | 'stock_low'
  | 'new_client'
  | 'barber_invite'
  | 'system';

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  new_appointment: '📅',
  appointment_confirmed: '✅',
  appointment_reminder: '🔔',
  appointment_cancelled: '❌',
  appointment_completed: '⭐',
  payment_received: '💰',
  stock_low: '⚠️',
  new_client: '👤',
  barber_invite: '✂️',
  system: '🔧',
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  new_appointment: '#C8FF00',
  appointment_confirmed: '#4CAF50',
  appointment_reminder: '#FF9800',
  appointment_cancelled: '#F44336',
  appointment_completed: '#C8FF00',
  payment_received: '#4CAF50',
  stock_low: '#FF9800',
  new_client: '#2196F3',
  barber_invite: '#9C27B0',
  system: '#607D8B',
};

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotification: (params: SendNotificationParams) => Promise<void>;
  refetch: () => Promise<void>;
}

interface SendNotificationParams {
  recipient_id: string;
  recipient_role: 'admin' | 'barbeiro' | 'client';
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  appointment_id?: string;
  salon_id?: string;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);

          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            const icon = NOTIFICATION_ICONS[newNotification.type] || '🔔';
            new Notification(`${icon} ${newNotification.title}`, {
              body: newNotification.message,
              icon: '/favicon.ico',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  const sendNotification = useCallback(
    async (params: SendNotificationParams) => {
      try {
        const { error } = await supabase.from('notifications').insert({
          recipient_id: params.recipient_id,
          recipient_role: params.recipient_role,
          type: params.type,
          title: params.title,
          message: params.message,
          data: params.data || {},
          appointment_id: params.appointment_id || null,
          salon_id: params.salon_id || null,
        });

        if (error) throw error;
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    sendNotification,
    refetch: fetchNotifications,
  };
}
