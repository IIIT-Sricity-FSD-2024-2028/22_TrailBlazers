import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

export interface NotificationRow {
  id: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  senderUserId?: string;
  senderName?: string;
  senderRole?: string;
  eventName?: string;
  isRead: number;
  status: string;
  createdAt: string;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly store: InMemoryStore) {}

  getUserNotifications(userId: string, limit = 50): NotificationRow[] {
    if (!userId) return [];
    return this.store
      .find<NotificationRow>(
        'notifications',
        (n) => n.recipientUserId === userId && (n.status === 'MISSED' || !n.status),
      )
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, limit);
  }

  getPendingPopups(userId: string): NotificationRow[] {
    if (!userId) return [];
    return this.store
      .find<NotificationRow>(
        'notifications',
        (n) => n.recipientUserId === userId && n.status === 'POPUP_PENDING',
      )
      .sort((a, b) => (a.createdAt || '').localeCompare(a.createdAt || ''));
  }

  getUnreadCount(userId: string): number {
    if (!userId) return 0;
    return this.store.count<NotificationRow>(
      'notifications',
      (n) =>
        n.recipientUserId === userId &&
        (n.status === 'MISSED' || !n.status) &&
        (Number(n.isRead) === 0 || !n.isRead),
    );
  }

  interactNotification(userId: string, notificationId: string, action: string): boolean {
    if (!userId || !notificationId) return false;

    const notif = this.store.findById<NotificationRow>('notifications', notificationId);
    if (!notif || notif.recipientUserId !== userId) return false;

    let newStatus = 'MISSED';
    let isRead = 0;

    if (action === 'VIEW') {
      newStatus = 'HANDLED';
      isRead = 1;
    } else if (action === 'DISMISS') {
      newStatus = 'DISMISSED';
      isRead = 1;
    } else if (action === 'EXPIRE') {
      newStatus = 'MISSED';
      isRead = 0;
    }

    const updated = this.store.update<NotificationRow>('notifications', notificationId, {
      status: newStatus,
      isRead,
    } as any);

    return !!updated;
  }

  autoExpirePending(userId: string): number {
    if (!userId) return 0;
    const pending = this.store.find<NotificationRow>(
      'notifications',
      (n) => n.recipientUserId === userId && n.status === 'POPUP_PENDING',
    );

    let count = 0;
    for (const item of pending) {
      this.store.update<NotificationRow>('notifications', item.id, {
        status: 'MISSED',
        isRead: 0,
      } as any);
      count++;
    }
    return count;
  }

  markAsRead(userId: string, notificationId: string): boolean {
    if (!userId || !notificationId) return false;
    const notif = this.store.findById<NotificationRow>('notifications', notificationId);
    if (!notif || notif.recipientUserId !== userId) return false;

    const updated = this.store.update<NotificationRow>('notifications', notificationId, {
      isRead: 1,
    } as any);

    return !!updated;
  }

  markAllAsRead(userId: string): number {
    if (!userId) return 0;
    const items = this.store.find<NotificationRow>(
      'notifications',
      (n) =>
        n.recipientUserId === userId &&
        (n.status === 'MISSED' || !n.status) &&
        (Number(n.isRead) === 0 || !n.isRead),
    );

    let count = 0;
    for (const item of items) {
      this.store.update<NotificationRow>('notifications', item.id, {
        isRead: 1,
      } as any);
      count++;
    }
    return count;
  }

  deleteNotification(userId: string, notificationId: string): boolean {
    if (!userId || !notificationId) return false;
    const notif = this.store.findById<NotificationRow>('notifications', notificationId);
    if (!notif || notif.recipientUserId !== userId) return false;

    return this.store.delete('notifications', notificationId);
  }

  clearAllNotifications(userId: string): number {
    if (!userId) return 0;
    return this.store.deleteWhere<NotificationRow>(
      'notifications',
      (n) => n.recipientUserId === userId,
    );
  }
}
