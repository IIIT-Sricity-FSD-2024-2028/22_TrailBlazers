import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

@Injectable()
export class InvitationsRepository {
  constructor(private readonly store: InMemoryStore) {}

  findEventById(eventId: string) {
    if (!eventId) return null;
    return this.store.findById('events', eventId);
  }

  findInvitationById(id: string) {
    if (!id) return null;
    const inv = this.store.findById<any>('event_invitations', id);
    if (!inv) return null;

    const event = this.store.findById<any>('events', inv.eventId);
    return {
      ...inv,
      organizerUserId: event ? event.organizerUserId : null,
    };
  }

  findInvitationRecordById(id: string) {
    if (!id) return null;
    return this.store.findById('event_invitations', id);
  }

  findInvitationByTokenOrCode(eventId: string, codeOrToken: string) {
    if (!eventId || !codeOrToken) return null;
    const cleanCode = codeOrToken.trim().toUpperCase();

    return this.store.findOne<any>(
      'event_invitations',
      (i) =>
        i.eventId === eventId &&
        (i.invitationToken === codeOrToken.trim() ||
          (i.inviteCode && i.inviteCode.toUpperCase() === cleanCode)),
    );
  }

  createInvitation(params: {
    id: string;
    eventId: string;
    invitationToken: string;
    inviteCode: string;
    recipientEmail: string;
    recipientName: string | null;
    senderUserId: string;
    expiresAt: string;
  }) {
    const {
      id,
      eventId,
      invitationToken,
      inviteCode,
      recipientEmail,
      recipientName,
      senderUserId,
      expiresAt,
    } = params;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const inv = {
      id,
      eventId,
      invitationToken,
      inviteCode,
      recipientEmail,
      recipientName,
      senderUserId,
      status: 'pending',
      expiresAt,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    return this.store.create('event_invitations', inv);
  }

  updateInvitationStatus(id: string, status: string) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.update<any>('event_invitations', id, {
      status,
      updatedAt: nowStr,
    });
  }

  checkAndUpdateExpired(inv: any) {
    if (!inv) return null;
    if (inv.status === 'pending' && new Date(inv.expiresAt) < new Date()) {
      this.updateInvitationStatus(inv.id, 'expired');
      return { ...inv, status: 'expired' };
    }
    return inv;
  }

  isSender(eventId: string, userId: string): boolean {
    if (!eventId || !userId) return false;
    return (
      this.store.count(
        'event_invitations',
        (i) => i.eventId === eventId && i.senderUserId === userId,
      ) > 0
    );
  }

  findInvitationsByEventId(eventId: string) {
    if (!eventId) return [];
    const invs = this.store.find<any>(
      'event_invitations',
      (i) => i.eventId === eventId,
    );

    const mapped = invs.map((inv) => {
      const sender = this.store.findById<any>('users', inv.senderUserId);
      const updatedInv = this.checkAndUpdateExpired(inv);
      return {
        ...updatedInv,
        senderName: sender ? sender.name : null,
      };
    });

    return mapped.sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || ''),
    );
  }

  revokeInvitation(id: string) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.update<any>('event_invitations', id, {
      status: 'revoked',
      updatedAt: nowStr,
    });
  }

  markInvitationAccepted(invitationId: string, userId: string) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.update<any>('event_invitations', invitationId, {
      status: 'accepted',
      usedAt: nowStr,
      usedByUserId: userId,
      updatedAt: nowStr,
    });
  }
}
