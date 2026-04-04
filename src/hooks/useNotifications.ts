/**
 * Adapter hook — wraps NotificationContext and re-exposes it using the
 * snake_case field names that page components (e.g. CustomerNotifications.tsx)
 * expect (is_read, created_at).
 *
 * All real-time subscriptions and mutations are delegated to NotificationContext.
 */

import { useMemo } from 'react';
import { useNotifications as _useCtx } from '../contexts/NotificationContext';

// ─── Types ──────────────────────────────────────────────────────────────────

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
  | 'system'
  | string;

export interface Notification {
  id: string;
  userId: string;
  barbershopId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  /** snake_case alias — maps from context's `read` field */
  is_read: boolean;
  /** snake_case alias — maps from context's `createdAt` field */
  created_at: string;
}

export const NOTIFICATION_ICONS: Record<string, string> = {
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

export const NOTIFICATION_COLORS: Record<string, string> = {
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

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = _useCtx();

  const notifications: Notification[] = useMemo(
    () =>
      ctx.notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        barbershopId: n.barbershopId,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        data: n.data,
        is_read: n.read,
        created_at: n.createdAt,
      })),
    [ctx.notifications]
  );

  return {
    notifications,
    unreadCount: ctx.unreadCount,
    loading: ctx.loading,
    panelOpen: ctx.panelOpen,
    setPanelOpen: ctx.setPanelOpen,
    markAsRead: ctx.markAsRead,
    markAllAsRead: ctx.markAllAsRead,
    removeNotification: ctx.removeNotification,
    refetch: ctx.refetch,
  };
}
