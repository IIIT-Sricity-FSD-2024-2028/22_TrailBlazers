import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

export interface ChangeRequestRow {
  id: string;
  eventRequestId: string;
  eventId?: string;
  quotationId?: string;
  clientUserId: string;
  clientName?: string;
  eventManagerUserId?: string;
  changeType?: string;
  currentDetails?: string;
  currentDetail?: string;
  requestedChange?: string;
  requestedDetail?: string;
  reason?: string;
  hasFinancialImpact?: number;
  reviewNotes?: string;
  reviewComment?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  eventName?: string;
  organizationName?: string;
}

@Injectable()
export class ChangeRequestsRepository {
  constructor(private readonly store: InMemoryStore) {}

  findEventRequestById(id: string): any {
    if (!id) return null;
    return this.store.findById('event_requests', id);
  }

  createChangeRequest(params: {
    id: string;
    eventRequestId: string;
    eventId?: string | null;
    clientUserId: string;
    clientName?: string;
    eventManagerUserId?: string | null;
    changeType: string;
    currentDetails?: string | null;
    requestedChange: string;
    reason?: string | null;
  }): ChangeRequestRow {
    const {
      id,
      eventRequestId,
      eventId = null,
      clientUserId,
      clientName = null,
      eventManagerUserId = null,
      changeType,
      currentDetails = null,
      requestedChange,
      reason = null,
    } = params;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newItem: ChangeRequestRow = {
      id,
      eventRequestId,
      eventId: eventId || undefined,
      clientUserId,
      clientName: clientName || undefined,
      eventManagerUserId: eventManagerUserId || undefined,
      changeType,
      currentDetails: currentDetails || undefined,
      currentDetail: currentDetails || undefined,
      requestedChange,
      requestedDetail: requestedChange,
      reason: reason || undefined,
      status: 'PENDING',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    this.store.create('event_change_requests', newItem);
    return this.getChangeRequestById(id)!;
  }

  getChangeRequestById(id: string): ChangeRequestRow | null {
    if (!id) return null;
    const cr = this.store.findById<ChangeRequestRow>('event_change_requests', id);
    if (!cr) return null;

    return {
      ...cr,
      currentDetails: cr.currentDetails || cr.currentDetail,
      requestedChange: cr.requestedChange || cr.requestedDetail,
      reviewComment: cr.reviewComment || cr.reviewNotes,
    };
  }

  getChangeRequestsByClient(clientUserId: string): ChangeRequestRow[] {
    if (!clientUserId) return [];
    const changeRequests = this.store.find<ChangeRequestRow>(
      'event_change_requests',
      (cr) => cr.clientUserId === clientUserId,
    );

    return changeRequests
      .map((cr) => {
        const req = this.store.findById<any>('event_requests', cr.eventRequestId);
        return {
          ...cr,
          currentDetails: cr.currentDetails || cr.currentDetail,
          requestedChange: cr.requestedChange || cr.requestedDetail,
          reviewComment: cr.reviewComment || cr.reviewNotes,
          eventName: req ? req.eventName : undefined,
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  getPendingChangeRequestsForManager(managerUserId: string): ChangeRequestRow[] {
    if (!managerUserId) return [];
    const pendingCRs = this.store.find<ChangeRequestRow>(
      'event_change_requests',
      (cr) => cr.status === 'PENDING',
    );

    return pendingCRs
      .filter((cr) => {
        const req = this.store.findById<any>('event_requests', cr.eventRequestId);
        return (
          cr.eventManagerUserId === managerUserId ||
          (req && req.eventManagerUserId === managerUserId) ||
          !cr.eventManagerUserId
        );
      })
      .map((cr) => {
        const req = this.store.findById<any>('event_requests', cr.eventRequestId);
        return {
          ...cr,
          currentDetails: cr.currentDetails || cr.currentDetail,
          requestedChange: cr.requestedChange || cr.requestedDetail,
          eventName: req ? req.eventName : undefined,
          organizationName: req ? req.organizationName : undefined,
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  updateChangeRequestStatus(params: {
    id: string;
    status: string;
    reviewComment?: string | null;
    reviewedByUserId: string;
  }): ChangeRequestRow {
    const { id, status, reviewComment = null, reviewedByUserId } = params;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.update<ChangeRequestRow>('event_change_requests', id, {
      status,
      reviewComment: reviewComment || undefined,
      reviewNotes: reviewComment || undefined,
      reviewedByUserId,
      reviewedAt: nowStr,
      updatedAt: nowStr,
    } as any);

    return this.getChangeRequestById(id)!;
  }

  updateEventRequestData(eventRequestId: string, data: { agenda?: string }) {
    if (!eventRequestId || data.agenda === undefined) return;

    this.store.update<any>('event_requests', eventRequestId, {
      agenda: data.agenda,
    });

    const evt = this.store.findById('events', eventRequestId);
    if (evt) {
      this.store.update<any>('events', eventRequestId, {
        agenda: data.agenda,
      });
    }
  }

  findUsersByRole(role: string): { id: string }[] {
    const users = this.store.find<any>('users', (u) => u.role === role);
    return users.map((u) => ({ id: u.id }));
  }
}
