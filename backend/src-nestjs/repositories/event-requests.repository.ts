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
  startDate?: string;
  endDate?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  location: string;
  eventType: string;
  expectedAttendance: number;
  isPaid: number;
  ticketPrice: number;
  frequency?: string;
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
    startDate?: string;
    endDate?: string;
    eventDate?: string;
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
    const startDate = (params.startDate || params.eventDate || '').trim();
    const endDate = (params.endDate || params.startDate || params.eventDate || '').trim();
    const eventDate = startDate || (params.eventDate || '').trim();

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
      startDate,
      endDate,
      eventDate,
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

        const stats = this.calculateEventStats(r.id);

        return {
          ...r,
          startDate: r.startDate || r.eventDate,
          endDate: r.endDate || undefined,
          eventManagerName: mgr ? mgr.name : null,
          eventManagerEmail: mgr ? mgr.email : null,
          onsiteCoordinatorName: coord ? coord.name : null,
          onsiteCoordinatorEmail: coord ? coord.email : null,
          quotationStatus: quote ? quote.status : null,
          event: evt || null,
          sessions,
          ticketsSold: stats.ticketsSold,
          attendeeCheckIns: stats.attendeeCheckIns,
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  findEventById(id: string): any | null {
    if (!id) return null;
    return this.store.findById('events', id);
  }

  calculateEventStats(eventId: string): { ticketsSold: number; attendeeCheckIns: number } {
    if (!eventId) return { ticketsSold: 0, attendeeCheckIns: 0 };

    const candidateIds = new Set<string>();
    candidateIds.add(eventId);

    const req = this.store.findById<any>('event_requests', eventId);
    if (req) {
      if (req.id) candidateIds.add(req.id);
      if (req.requestId) candidateIds.add(req.requestId);
      if (req.eventName) {
        const matchingEvents = this.store.find<any>(
          'events',
          (e) => (e.name && e.name.toLowerCase().trim() === req.eventName.toLowerCase().trim()) || e.id === req.id,
        );
        for (const me of matchingEvents) candidateIds.add(me.id);
      }
    }

    const evt = this.store.findById<any>('events', eventId);
    if (evt) {
      candidateIds.add(evt.id);
      if (evt.name) {
        const matchingReqs = this.store.find<any>(
          'event_requests',
          (r) => (r.eventName && r.eventName.toLowerCase().trim() === evt.name.toLowerCase().trim()) || r.id === evt.id,
        );
        for (const mr of matchingReqs) candidateIds.add(mr.id);
      }
    }

    const allTickets = this.store.findAll<any>('tickets');
    const matchingTickets = allTickets.filter((t) => candidateIds.has(t.eventId));

    let ticketsSold = 0;
    let attendeeCheckIns = 0;
    const processedTicketIds = new Set<string>();

    for (const t of matchingTickets) {
      if (t.id && processedTicketIds.has(t.id)) continue;
      if (t.id) processedTicketIds.add(t.id);

      const regStatus = (t.registrationStatus || t.status || '').toUpperCase();
      const payStatus = (t.paymentStatus || '').toUpperCase();

      // Exclude cancelled, refunded, failed, or pending transactions
      if (
        regStatus === 'CANCELLED' ||
        regStatus === 'REFUNDED' ||
        payStatus === 'REFUNDED' ||
        payStatus === 'FAILED' ||
        payStatus === 'PENDING'
      ) {
        continue;
      }

      // Valid confirmed sales: CONFIRMED / SUCCESS / ACTIVE
      const isConfirmed =
        payStatus === 'CONFIRMED' ||
        payStatus === 'SUCCESS' ||
        regStatus === 'ACTIVE' ||
        regStatus === 'CONFIRMED' ||
        (!t.isPaid && regStatus !== 'CANCELLED');

      if (isConfirmed) {
        const qty = Number(t.quantity) || 1;
        ticketsSold += qty;

        const isCheckedIn = t.checkedIn === 1 || t.checkedIn === true;
        if (isCheckedIn) {
          attendeeCheckIns += qty;
        }
      }
    }

    return {
      ticketsSold,
      attendeeCheckIns,
    };
  }

  findEnrichedRequestById(id: string): any | null {
    if (!id) return null;
    const r = this.findRequestById(id) || this.findEventById(id);
    if (!r) return null;
    const mgr = r.eventManagerUserId
      ? this.store.findById<any>('users', r.eventManagerUserId)
      : null;
    const coord = r.onsiteCoordinatorUserId
      ? this.store.findById<any>('users', r.onsiteCoordinatorUserId)
      : null;
    const stats = this.calculateEventStats(r.id);
    return {
      ...r,
      startDate: r.startDate || r.eventDate || '',
      endDate: r.endDate || '',
      eventManagerName: mgr ? mgr.name : (r.eventManagerName || null),
      eventManagerEmail: mgr ? mgr.email : (r.eventManagerEmail || null),
      onsiteCoordinatorName: coord ? coord.name : (r.onsiteCoordinatorName || null),
      onsiteCoordinatorEmail: coord ? coord.email : (r.onsiteCoordinatorEmail || null),
      ticketsSold: stats.ticketsSold,
      attendeeCheckIns: stats.attendeeCheckIns,
    };
  }

  findRevenueUsers(): { id: string }[] {
    const users = this.store.find<any>('users', (u) => u.role === 'REVENUE');
    return users.map((u) => ({ id: u.id }));
  }
}

