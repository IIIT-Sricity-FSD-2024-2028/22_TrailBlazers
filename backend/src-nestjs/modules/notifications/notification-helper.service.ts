import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { InMemoryStore } from '../../repositories/in-memory.store';

@Injectable()
export class NotificationHelperService {
  constructor(private readonly store: InMemoryStore) {}

  createNotification(params: {
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
    deduplicate?: boolean;
    status?: string;
  }) {
    const {
      recipientUserId,
      type,
      title,
      message,
      entityType,
      entityId,
      senderUserId,
      senderName,
      senderRole,
      eventName,
      deduplicate = false,
      status = 'POPUP_PENDING',
    } = params;

    if (!recipientUserId || !type || !title || !message) {
      return null;
    }

    try {
      if (deduplicate && entityId) {
        const existing = this.store.findOne<any>(
          'notifications',
          (n) =>
            n.recipientUserId === recipientUserId &&
            n.type === type &&
            n.entityId === entityId &&
            (n.status === 'POPUP_PENDING' || n.status === 'UNREAD'),
        );
        if (existing) {
          return existing.id;
        }
      }

      const id = `notif-${crypto.randomUUID()}`;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      this.store.create('notifications', {
        id,
        recipientUserId,
        type,
        title,
        message,
        entityType: entityType || null,
        entityId: entityId || null,
        senderUserId: senderUserId || null,
        senderName: senderName || null,
        senderRole: senderRole || null,
        eventName: eventName || null,
        isRead: 0,
        status,
        createdAt: nowStr,
      });

      return id;
    } catch (err) {
      console.error('Error creating notification in NotificationHelperService:', err);
      return null;
    }
  }
}
