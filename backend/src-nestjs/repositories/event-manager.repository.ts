import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import { NestLoggerService } from '../common/logging/logger.service';

@Injectable()
export class EventManagerRepository {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  getDashboardMetrics() {
    const approvedEvents = this.store.count(
      'event_requests',
      (r) => r.status === 'COMMERCIAL_APPROVED' || r.status === 'ACCEPTED',
    );

    const inPreparation = this.store.count(
      'event_requests',
      (r) => r.operationalStatus === 'IN_PREPARATION',
    );

    const readyEvents = this.store.count(
      'event_requests',
      (r) => r.operationalStatus === 'READY',
    );

    const upcomingEvents = this.store.count(
      'event_requests',
      (r) =>
        r.status === 'COMMERCIAL_APPROVED' ||
        r.status === 'ACCEPTED' ||
        r.operationalStatus === 'IN_PREPARATION' ||
        r.operationalStatus === 'READY',
    );

    return {
      approvedEvents,
      inPreparation,
      readyEvents,
      upcomingEvents,
    };
  }

  getPriorityEvents(limit = 10) {
    const reqs = this.store.find<any>(
      'event_requests',
      (r) =>
        r.status === 'COMMERCIAL_APPROVED' ||
        r.status === 'ACCEPTED' ||
        r.operationalStatus === 'IN_PREPARATION' ||
        r.operationalStatus === 'READY',
    );

    const mapped = reqs.map((r) => {
      const client = this.store.findById<any>('users', r.userId);
      const coord = r.onsiteCoordinatorUserId
        ? this.store.findById<any>('users', r.onsiteCoordinatorUserId)
        : null;
      return {
        ...r,
        clientName: client ? client.name : null,
        coordinatorName: coord ? coord.name : null,
        coordinatorEmail: coord ? coord.email : null,
      };
    });

    return mapped
      .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''))
      .slice(0, limit);
  }

  findEvents(filters: { search?: string; status?: string } = {}) {
    let reqs = this.store.find<any>(
      'event_requests',
      (r) =>
        r.status === 'COMMERCIAL_APPROVED' ||
        r.status === 'ACCEPTED' ||
        r.operationalStatus === 'IN_PREPARATION' ||
        r.operationalStatus === 'READY',
    );

    const { search, status } = filters;

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      reqs = reqs.filter(
        (r) =>
          (r.eventName && r.eventName.toLowerCase().includes(term)) ||
          (r.organizationName && r.organizationName.toLowerCase().includes(term)) ||
          (r.venue && r.venue.toLowerCase().includes(term)),
      );
    }

    if (status && status !== 'ALL') {
      reqs = reqs.filter((r) => r.operationalStatus === status);
    }

    const mapped = reqs.map((r) => {
      const client = this.store.findById<any>('users', r.userId);
      const coord = r.onsiteCoordinatorUserId
        ? this.store.findById<any>('users', r.onsiteCoordinatorUserId)
        : null;
      return {
        ...r,
        clientName: client ? client.name : null,
        coordinatorName: coord ? coord.name : null,
        coordinatorEmail: coord ? coord.email : null,
      };
    });

    return mapped.sort((a, b) =>
      (a.eventDate || '').localeCompare(b.eventDate || ''),
    );
  }

  findEventDetailsById(id: string) {
    if (!id) return null;
    const r = this.store.findById<any>('event_requests', id);
    if (!r) return null;

    const client = this.store.findById<any>('users', r.userId);
    const coord = r.onsiteCoordinatorUserId
      ? this.store.findById<any>('users', r.onsiteCoordinatorUserId)
      : null;

    return {
      ...r,
      clientName: client ? client.name : null,
      clientEmail: client ? client.email : null,
      clientOrg: client ? client.organization : null,
      coordinatorName: coord ? coord.name : null,
      coordinatorEmail: coord ? coord.email : null,
    };
  }

  countInvitations(eventId: string): number {
    if (!eventId) return 0;
    return this.store.count('event_invitations', (i) => i.eventId === eventId);
  }

  autoAssignManager(id: string, managerUserId: string) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.update<any>('event_requests', id, {
      operationalStatus: 'IN_PREPARATION',
      eventManagerUserId: managerUserId,
      updatedAt: nowStr,
    });
  }

  updateEventConfig(params: {
    id: string;
    regStatus: string;
    regDeadline: string;
    capacity: number;
    auditLogId: string;
    actorUserId: string;
    actorName: string;
  }) {
    const {
      id,
      regStatus,
      regDeadline,
      capacity,
      auditLogId,
      actorUserId,
      actorName,
    } = params;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.update<any>('event_requests', id, {
      registrationStatus: regStatus,
      registrationDeadline: regDeadline,
      expectedAttendance: capacity,
      updatedAt: nowStr,
    });

    const publishedEvt = this.store.findById<any>('events', id);
    if (publishedEvt) {
      this.store.update<any>('events', id, {
        registrationStatus: regStatus,
        registrationDeadline: regDeadline,
        status: regStatus === 'OPEN' ? 'PUBLISHED' : publishedEvt.status || 'PUBLISHED',
        totalTickets: capacity,
        availableTickets: Math.max(0, capacity - (publishedEvt.ticketsSold || 0)),
        updatedAt: nowStr,
      });
    } else {
      const req = this.store.findById<any>('event_requests', id);
      if (req) {
        this.store.create('events', {
          id: req.id,
          name: req.eventName,
          eventName: req.eventName,
          organizationName: req.organizationName,
          category: req.category,
          date: req.eventDate,
          eventDate: req.eventDate,
          startTime: req.startTime || '09:00 AM',
          endTime: req.endTime || '05:00 PM',
          venue: req.venue,
          location: req.venue,
          type: req.eventType || 'PUBLIC',
          registrationStatus: regStatus,
          registrationDeadline: regDeadline,
          ticketPrice: req.ticketPrice || 0,
          totalTickets: capacity,
          availableTickets: capacity,
          status: 'PUBLISHED',
          description: req.additionalNotes || req.eventName,
          bannerUrl: req.bannerUrl || null,
          createdAt: nowStr,
          updatedAt: nowStr,
        });
      }
    }

    this.store.create('event_operations_audit_logs', {
      id: auditLogId,
      eventRequestId: id,
      actorUserId,
      actorName,
      actorRole: 'EVENT_MANAGER',
      action: 'CONFIGURED_EVENT',
      details: `Updated registration status to ${regStatus}, deadline to ${regDeadline}, capacity to ${capacity}`,
      createdAt: nowStr,
    });
  }

  findCoordinators() {
    return this.store
      .find<any>('users', (u) => u.role === 'ONSITE_COORDINATOR')
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        organization: u.organization,
      }));
  }

  findUserById(userId: string) {
    if (!userId) return null;
    return this.store.findById('users', userId);
  }

  assignCoordinator(params: {
    id: string;
    coordinatorUserId: string;
    auditLogId: string;
    actorUserId: string;
    actorName: string;
    coordinatorName: string;
    coordinatorEmail: string;
  }) {
    const {
      id,
      coordinatorUserId,
      auditLogId,
      actorUserId,
      actorName,
      coordinatorName,
      coordinatorEmail,
    } = params;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.update<any>('event_requests', id, {
      onsiteCoordinatorUserId: coordinatorUserId,
      updatedAt: nowStr,
    });

    this.store.create('event_operations_audit_logs', {
      id: auditLogId,
      eventRequestId: id,
      actorUserId,
      actorName,
      actorRole: 'EVENT_MANAGER',
      action: 'ASSIGNED_COORDINATOR',
      details: `Assigned Onsite Coordinator ${coordinatorName} (${coordinatorEmail}) to event.`,
      createdAt: nowStr,
    });
  }

  markEventReady(params: {
    id: string;
    actorUserId: string;
    actorName: string;
    auditLogId: string;
  }) {
    const { id, actorUserId, actorName, auditLogId } = params;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.update<any>('event_requests', id, {
      operationalStatus: 'READY',
      markedReadyAt: nowStr,
      markedReadyByUserId: actorUserId,
      updatedAt: nowStr,
    });

    this.store.create('event_operations_audit_logs', {
      id: auditLogId,
      eventRequestId: id,
      actorUserId,
      actorName,
      actorRole: 'EVENT_MANAGER',
      action: 'MARKED_EVENT_READY',
      details: 'Event marked operational READY (100% readiness completed).',
      createdAt: nowStr,
    });
  }

  createInvitation(params: {
    invId: string;
    eventId: string;
    tokenStr: string;
    inviteCodeStr: string;
    recipientEmail: string;
    recipientName: string | null;
    senderUserId: string;
    expiresAt: string;
  }) {
    const {
      invId,
      eventId,
      tokenStr,
      inviteCodeStr,
      recipientEmail,
      recipientName,
      senderUserId,
      expiresAt,
    } = params;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const inv = {
      id: invId,
      eventId,
      invitationToken: tokenStr,
      inviteCode: inviteCodeStr,
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

  findInvitationById(id: string) {
    if (!id) return null;
    return this.store.findById('event_invitations', id);
  }

  revokeInvitation(id: string) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.update<any>('event_invitations', id, {
      status: 'revoked',
      updatedAt: nowStr,
    });
  }

  findInvitationsByEventId(eventId: string) {
    if (!eventId) return [];
    return this.store
      .find<any>('event_invitations', (i) => i.eventId === eventId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  findAuditLogsByEventRequestId(eventRequestId: string) {
    if (!eventRequestId) return [];
    return this.store
      .find<any>('event_operations_audit_logs', (l) => l.eventRequestId === eventRequestId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  findSessionsByEventId(eventId: string) {
    if (!eventId) return [];
    return this.store
      .find<any>('event_sessions', (s) => s.eventId === eventId)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }

  createSession(params: {
    sessionId: string;
    eventId: string;
    speakerUserId?: string;
    title: string;
    hall: string;
    startTime: string;
    endTime: string;
  }) {
    const { sessionId, eventId, speakerUserId, title, hall, startTime, endTime } = params;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const session = {
      id: sessionId,
      eventId,
      speakerUserId: speakerUserId || 'usr_speaker_default',
      title,
      hall,
      startTime,
      endTime,
      status: 'UPCOMING',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    return this.store.create('event_sessions', session);
  }
}
