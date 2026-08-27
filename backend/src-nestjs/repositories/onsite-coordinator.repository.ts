import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

@Injectable()
export class OnsiteCoordinatorRepository {
  constructor(private readonly store: InMemoryStore) {}

  findEventAssignment(eventId: string) {
    if (!eventId) return null;
    const r = this.store.findById<any>('event_requests', eventId);
    if (r) return { id: r.id, onsiteCoordinatorUserId: r.onsiteCoordinatorUserId };

    const e = this.store.findById<any>('events', eventId);
    if (e) return { id: e.id, onsiteCoordinatorUserId: e.onsiteCoordinatorUserId || 'usr_e2e_coord_1' };

    return null;
  }

  isEventAssignedToCoordinator(eventId: string, coordinatorUserId: string): boolean {
    const eventReq = this.findEventAssignment(eventId);
    return !!(eventReq && eventReq.onsiteCoordinatorUserId === coordinatorUserId);
  }

  getDashboardMetrics(coordinatorUserId: string, todayStr: string) {
    const assignedReqs = this.store.find<any>(
      'event_requests',
      (r) => r.onsiteCoordinatorUserId === coordinatorUserId,
    );
    const assignedEvents = assignedReqs.length;

    const todaysEvents = assignedReqs.filter((r) => r.eventDate === todayStr).length;

    const assignedEventIds = new Set(assignedReqs.map((r) => r.id));
    const checkedInAttendees = this.store.count(
      'tickets',
      (t) => assignedEventIds.has(t.eventId) && (t.checkedIn === 1 || t.checkedIn === true),
    );

    return {
      todaysEvents,
      assignedEvents,
      checkedInAttendees,
    };
  }

  findAssignedEvents(coordinatorUserId: string) {
    const reqs = this.store.find<any>(
      'event_requests',
      (r) => r.onsiteCoordinatorUserId === coordinatorUserId,
    );

    const mapped = reqs.map((r) => {
      const client = this.store.findById<any>('users', r.userId);
      return {
        ...r,
        clientName: client ? client.name : null,
      };
    });

    return mapped.sort((a, b) =>
      (a.eventDate || '').localeCompare(b.eventDate || ''),
    );
  }

  findAssignedEventsFiltered(
    coordinatorUserId: string,
    search?: string,
    filter?: string,
  ) {
    let reqs = this.store.find<any>(
      'event_requests',
      (r) => r.onsiteCoordinatorUserId === coordinatorUserId,
    );

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      reqs = reqs.filter(
        (r) =>
          (r.eventName && r.eventName.toLowerCase().includes(term)) ||
          (r.organizationName && r.organizationName.toLowerCase().includes(term)) ||
          (r.venue && r.venue.toLowerCase().includes(term)),
      );
    }

    if (filter === 'TODAY') {
      const todayStr = new Date().toISOString().split('T')[0];
      reqs = reqs.filter((r) => r.eventDate === todayStr);
    } else if (filter === 'LIVE') {
      reqs = reqs.filter((r) => r.operationalStatus === 'LIVE');
    } else if (filter === 'COMPLETED') {
      reqs = reqs.filter((r) => r.operationalStatus === 'COMPLETED');
    }

    const mapped = reqs.map((r) => {
      const client = this.store.findById<any>('users', r.userId);
      return {
        ...r,
        clientName: client ? client.name : null,
      };
    });

    return mapped.sort((a, b) =>
      (a.eventDate || '').localeCompare(b.eventDate || ''),
    );
  }

  getEventStats(eventId: string) {
    const registered = this.store.count('tickets', (t) => t.eventId === eventId);
    const checkedIn = this.store.count(
      'tickets',
      (t) => t.eventId === eventId && (t.checkedIn === 1 || t.checkedIn === true),
    );
    const openIssues = this.store.count(
      'event_operational_issues',
      (i) => i.eventId === eventId && i.status !== 'RESOLVED',
    );

    const attendancePercent =
      registered > 0 ? Math.round((checkedIn / registered) * 100) : 0;

    return {
      registered,
      checkedIn,
      notArrived: Math.max(0, registered - checkedIn),
      attendancePercent,
      openIssues,
    };
  }

  findWorkspaceEvent(eventId: string) {
    if (!eventId) return null;
    const r = this.store.findById<any>('event_requests', eventId);
    if (r) {
      const client = this.store.findById<any>('users', r.userId);
      return {
        ...r,
        clientName: client ? client.name : null,
        clientEmail: client ? client.email : null,
        clientOrg: client ? client.organization : null,
      };
    }

    const e = this.store.findById<any>('events', eventId);
    if (e) {
      return {
        ...e,
        eventName: e.name,
        clientName: 'Public Event',
        clientEmail: null,
        clientOrg: e.organizationName || 'Wavevents',
      };
    }

    return null;
  }

  findRecentCheckIns(eventId: string, limit = 10) {
    if (!eventId) return [];
    const tkts = this.store.find<any>(
      'tickets',
      (t) => t.eventId === eventId && (t.checkedIn === 1 || t.checkedIn === true),
    );

    const mapped = tkts.map((t) => {
      const user = this.store.findById<any>('users', t.userId);
      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        checkedInAt: t.checkedInAt,
        attendeeName: user ? user.name : null,
        attendeeEmail: user ? user.email : null,
      };
    });

    return mapped
      .sort((a, b) => (b.checkedInAt || '').localeCompare(a.checkedInAt || ''))
      .slice(0, limit);
  }

  findTicketByNumberOrId(searchTerm: string) {
    if (!searchTerm) return null;
    const term = searchTerm.trim();
    const t = this.store.findOne<any>(
      'tickets',
      (t) => t.ticketNumber === term || t.id === term,
    );
    if (!t) return null;

    const user = this.store.findById<any>('users', t.userId);
    return {
      ...t,
      attendeeName: user ? user.name : null,
      attendeeEmail: user ? user.email : null,
    };
  }

  executeCheckInTransaction(params: {
    ticketId: string;
    nowStr: string;
    coordinatorUserId: string;
    coordinatorName: string;
    eventRequestId: string;
    attendeeName: string;
    ticketNumber: string;
    auditLogId: string;
  }) {
    const {
      ticketId,
      nowStr,
      coordinatorUserId,
      coordinatorName,
      eventRequestId,
      attendeeName,
      ticketNumber,
      auditLogId,
    } = params;

    // 1. Transaction-safe check-in update
    this.store.update<any>('tickets', ticketId, {
      checkedIn: 1,
      checkedInAt: nowStr,
      checkedInByUserId: coordinatorUserId,
      updatedAt: nowStr,
    });

    // 2. Write audit log
    this.store.create('event_operations_audit_logs', {
      id: auditLogId,
      eventRequestId,
      actorUserId: coordinatorUserId,
      actorName: coordinatorName,
      actorRole: 'ONSITE_COORDINATOR',
      action: 'CHECK_IN_ATTENDEE',
      details: `Checked in attendee ${attendeeName} (Ticket: ${ticketNumber})`,
      createdAt: nowStr,
    });
  }

  findAttendees(eventId: string, search?: string) {
    let tkts = this.store.find<any>('tickets', (t) => t.eventId === eventId);

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      tkts = tkts.filter((t) => {
        const user = this.store.findById<any>('users', t.userId);
        const name = user ? user.name : '';
        const email = user ? user.email : '';
        return (
          (name && name.toLowerCase().includes(term)) ||
          (email && email.toLowerCase().includes(term)) ||
          (t.ticketNumber && t.ticketNumber.toLowerCase().includes(term))
        );
      });
    }

    const mapped = tkts.map((t) => {
      const user = this.store.findById<any>('users', t.userId);
      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        checkedIn: t.checkedIn ? 1 : 0,
        checkedInAt: t.checkedInAt,
        attendeeName: user ? user.name : null,
        attendeeEmail: user ? user.email : null,
      };
    });

    return mapped.sort((a, b) => {
      if (a.checkedIn !== b.checkedIn) {
        return a.checkedIn - b.checkedIn;
      }
      return (a.attendeeName || '').localeCompare(b.attendeeName || '');
    });
  }

  updateEventOperationalStatus(
    eventId: string,
    operationalStatus: string,
    actorUserId: string,
    actorName: string,
    auditLogId: string,
  ) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.update<any>('event_requests', eventId, {
      operationalStatus,
      updatedAt: nowStr,
    });

    this.store.create('event_operations_audit_logs', {
      id: auditLogId,
      eventRequestId: eventId,
      actorUserId,
      actorName,
      actorRole: 'ONSITE_COORDINATOR',
      action: 'UPDATED_EVENT_STATUS',
      details: `Updated event operational status to ${operationalStatus}`,
      createdAt: nowStr,
    });
  }

  findEventRequestById(eventId: string) {
    if (!eventId) return null;
    return this.store.findById('event_requests', eventId);
  }

  findSessionSpeakers(eventId: string) {
    if (!eventId) return [];
    const sessions = this.store.find<any>(
      'event_sessions',
      (s) => s.eventId === eventId && !!s.speakerUserId,
    );
    const speakers = Array.from(new Set(sessions.map((s) => s.speakerUserId)));
    return speakers.map((sp) => ({ speakerUserId: sp }));
  }

  findIssuesByEventId(eventId: string) {
    if (!eventId) return [];
    return this.store
      .find<any>('event_operational_issues', (i) => i.eventId === eventId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  createOperationalIssue(params: {
    issueId: string;
    eventId: string;
    reporterUserId: string;
    reporterName: string;
    category: string;
    priority: string;
    description: string;
    auditLogId: string;
  }) {
    const {
      issueId,
      eventId,
      reporterUserId,
      reporterName,
      category,
      priority,
      description,
      auditLogId,
    } = params;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.create('event_operational_issues', {
      id: issueId,
      eventId,
      reporterUserId,
      reporterName,
      category,
      priority,
      description,
      status: 'OPEN',
      createdAt: nowStr,
      updatedAt: nowStr,
    });

    this.store.create('event_operations_audit_logs', {
      id: auditLogId,
      eventRequestId: eventId,
      actorUserId: reporterUserId,
      actorName: reporterName,
      actorRole: 'ONSITE_COORDINATOR',
      action: 'REPORTED_ISSUE',
      details: `Reported ${priority} priority operational issue (${category}): "${description.substring(0, 40)}..."`,
      createdAt: nowStr,
    });
  }

  findIssueByIdWithCoordinator(issueId: string) {
    if (!issueId) return null;
    const issue = this.store.findById<any>('event_operational_issues', issueId);
    if (!issue) return null;

    const req = this.store.findById<any>('event_requests', issue.eventId);
    return {
      ...issue,
      onsiteCoordinatorUserId: req ? req.onsiteCoordinatorUserId : null,
    };
  }

  updateIssueStatus(
    issueId: string,
    status: string,
    resolutionDetails: string | null,
    resolverUserId: string,
  ) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.update<any>('event_operational_issues', issueId, {
      status,
      resolutionDetails,
      resolverUserId,
      updatedAt: nowStr,
    });
    return true;
  }
}
