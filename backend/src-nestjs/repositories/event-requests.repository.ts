import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import { NestLoggerService } from '../common/logging/logger.service';

export interface EventRequestEntity {
  id: string;
  requestId: string;
  userId: string;
  organizationName: string;
  contactEmail: string;
  eventName: string;
  description: string;
  agenda: string;
  category: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  location: string;
  eventType: string;
  expectedAttendance: number;
  isPaid: number;
  ticketPrice: number;
  frequency: string;
  recurringPerWeek: number;
  additionalNotes: string;
  bannerUrl?: string;
  status: string;
  operationalStatus?: string;
  eventManagerUserId?: string;
  onsiteCoordinatorUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class EventRequestsRepository {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  createRequest(params: {
    id: string;
    requestId: string;
    userId: string;
    organizationName: string;
    contactEmail: string;
    eventName: string;
    description?: string;
    agenda?: string;
    category?: string;
    eventDate: string;
    startTime?: string;
    endTime?: string;
    venue: string;
    location: string;
    eventType?: string;
    expectedAttendance?: number;
    isPaid?: boolean;
    ticketPrice?: number;
    frequency?: string;
    recurringPerWeek?: number;
    additionalNotes?: string;
    bannerUrl?: string;
    status: string;
  }): EventRequestEntity {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const entity: EventRequestEntity = {
      id: params.id,
      requestId: params.requestId,
      userId: params.userId,
      organizationName: params.organizationName.trim(),
      contactEmail: params.contactEmail.trim(),
      eventName: params.eventName.trim(),
      description: params.description || '',
      agenda: params.agenda || '',
      category: params.category || 'Tech Conference',
      eventDate: params.eventDate,
      startTime: params.startTime || '09:00 AM',
      endTime: params.endTime || '05:00 PM',
      venue: params.venue.trim(),
      location: params.location.trim(),
      eventType: params.eventType || 'OPEN',
      expectedAttendance: Number(params.expectedAttendance) || 100,
      isPaid: params.isPaid ? 1 : 0,
      ticketPrice: params.isPaid ? Number(params.ticketPrice || 0) : 0,
      frequency: params.frequency || 'One-time event',
      recurringPerWeek: Number(params.recurringPerWeek) || 0,
      additionalNotes: params.additionalNotes || '',
      bannerUrl: params.bannerUrl || '',
      status: params.status,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    this.store.create('event_requests', entity);

    this.logger.log(
      `Event request created in memory: ${params.id} (${params.requestId}) by ${params.userId}`,
      'EVENT_REQUESTS_REPOSITORY',
    );

    return this.findRequestById(params.id)!;
  }

  findRequestById(id: string): EventRequestEntity | null {
    if (!id) return null;
    return this.store.findById<EventRequestEntity>('event_requests', id);
  }

  findRequestsByUserId(userId: string): any[] {
    if (!userId) return [];
    const reqs = this.store.find<EventRequestEntity>(
      'event_requests',
      (r) => r.userId === userId,
    );

    return reqs
      .map((r) => {
        const mgr = r.eventManagerUserId
          ? this.store.findById<any>('users', r.eventManagerUserId)
          : null;
        const coord = r.onsiteCoordinatorUserId
          ? this.store.findById<any>('users', r.onsiteCoordinatorUserId)
          : null;
        const quote = this.store.findOne<any>(
          'quotations',
          (q) => q.eventRequestId === r.id,
        );
        const evt = this.store.findById<any>('events', r.id);
        const sessions = this.store
          .find<any>('event_sessions', (s) => s.eventId === r.id)
          .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

        return {
          ...r,
          eventManagerName: mgr ? mgr.name : null,
          eventManagerEmail: mgr ? mgr.email : null,
          onsiteCoordinatorName: coord ? coord.name : null,
          onsiteCoordinatorEmail: coord ? coord.email : null,
          quotationStatus: quote ? quote.status : null,
          event: evt || null,
          sessions,
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  findRevenueUsers(): { id: string }[] {
    const users = this.store.find<any>('users', (u) => u.role === 'REVENUE');
    return users.map((u) => ({ id: u.id }));
  }
}

