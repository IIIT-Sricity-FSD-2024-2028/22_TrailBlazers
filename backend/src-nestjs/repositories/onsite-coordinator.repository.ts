import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { InMemoryStore } from './in-memory.store';

@Injectable()
export class OnsiteCoordinatorRepository {
  constructor(private readonly store: InMemoryStore) {}

  private isCoordinatorAssigned(r: any, coordinatorUserId: string): boolean {
    if (!r) return false;
    if (r.onsiteCoordinatorUserId === coordinatorUserId) return true;
    if (
      Array.isArray(r.onsiteCoordinatorUserIds) &&
      r.onsiteCoordinatorUserIds.includes(coordinatorUserId)
    ) {
      return true;
    }
    return false;
  }

  findEventAssignment(eventId: string) {
    if (!eventId) return null;
    const r = this.store.findById<any>('event_requests', eventId);
    if (r) return { id: r.id, onsiteCoordinatorUserId: r.onsiteCoordinatorUserId, onsiteCoordinatorUserIds: r.onsiteCoordinatorUserIds };

    const e = this.store.findById<any>('events', eventId);
    if (e) return { id: e.id, onsiteCoordinatorUserId: e.onsiteCoordinatorUserId || null, onsiteCoordinatorUserIds: e.onsiteCoordinatorUserIds };

    return null;
  }

  isEventAssignedToCoordinator(eventId: string, coordinatorUserId: string): boolean {
    const eventReq = this.findEventAssignment(eventId);
    return this.isCoordinatorAssigned(eventReq, coordinatorUserId);
  }

  getDashboardMetrics(coordinatorUserId: string, todayStr: string) {
    const assignedReqs = this.store.find<any>(
      'event_requests',
      (r) => this.isCoordinatorAssigned(r, coordinatorUserId),
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
      (r) => this.isCoordinatorAssigned(r, coordinatorUserId),
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
      (r) => this.isCoordinatorAssigned(r, coordinatorUserId),
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

  ensureTicketMembersPopulated(ticket: any) {
    if (!ticket) return [];
    let members = this.store.find<any>('ticket_members', (m) => m.ticketId === ticket.id);
    if (!members || members.length === 0) {
      const quantity = Math.max(1, Number(ticket.quantity || ticket.totalMembers || 1));
      const user = this.store.findById<any>('users', ticket.userId);
      const primaryName = user ? (user.name || user.email || 'Primary Attendee') : 'Primary Attendee';
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      for (let i = 1; i <= quantity; i++) {
        const memberId = `tm_${ticket.id}_${i}`;
        const memberName = i === 1 ? primaryName : `${primaryName} (Guest ${i})`;
        const initialStatus = ticket.checkedIn === 1 ? 'INSIDE' : 'NOT_ENTERED';
        const newMember = {
          id: memberId,
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          eventId: ticket.eventId,
          memberIndex: i,
          memberName,
          entryStatus: ticket.registrationStatus === 'CANCELLED' ? 'CANCELLED' : initialStatus,
          firstEnteredAt: ticket.checkedIn === 1 ? (ticket.checkedInAt || nowStr) : null,
          lastActionAt: ticket.checkedIn === 1 ? (ticket.checkedInAt || nowStr) : null,
          lastAction: ticket.checkedIn === 1 ? 'ENTRY' : null,
          coordinatorId: ticket.checkedInByUserId || null,
          coordinatorName: null,
          createdAt: ticket.createdAt || nowStr,
          updatedAt: nowStr,
        };
        this.store.create('ticket_members', newMember);
      }
      members = this.store.find<any>('ticket_members', (m) => m.ticketId === ticket.id);
    }
    return members.sort((a, b) => a.memberIndex - b.memberIndex);
  }

  findTicketDetailed(searchTerm: string, eventId?: string) {
    if (!searchTerm) return null;
    const term = searchTerm.trim();
    let ticket = this.store.findOne<any>(
      'tickets',
      (t) =>
        t.ticketNumber === term ||
        t.id === term ||
        (eventId && t.eventId === eventId && (t.ticketNumber?.toLowerCase() === term.toLowerCase() || t.id?.toLowerCase() === term.toLowerCase())),
    );

    if (!ticket && (term.startsWith('{') || term.includes('ticketNumber') || term.includes('ticketId'))) {
      try {
        const parsed = JSON.parse(term);
        const targetNum = parsed.ticketNumber || parsed.ticketId || parsed.id;
        if (targetNum) {
          ticket = this.store.findOne<any>(
            'tickets',
            (t) => t.ticketNumber === targetNum || t.id === targetNum,
          );
        }
      } catch (e) {}
    }

    if (!ticket) return null;

    const user = this.store.findById<any>('users', ticket.userId);
    const event =
      this.store.findById<any>('events', ticket.eventId) ||
      this.store.findById<any>('event_requests', ticket.eventId);
    const members = this.ensureTicketMembersPopulated(ticket);

    const totalMembers = Number(ticket.totalMembers || ticket.quantity || members.length || 1);
    const membersInside = members.filter((m) => m.entryStatus === 'INSIDE').length;
    const membersOutside = members.filter((m) => m.entryStatus === 'OUTSIDE').length;
    const membersExitedPermanently = members.filter((m) => m.entryStatus === 'EXITED_PERMANENTLY').length;
    const membersNotEntered = members.filter((m) => m.entryStatus === 'NOT_ENTERED').length;
    const checkedInMembers = totalMembers - membersNotEntered;

    let overallStatus = 'NOT_ENTERED';
    if (membersNotEntered === 0 && membersInside > 0) {
      overallStatus = 'FULLY_CHECKED_IN';
    } else if (membersNotEntered === 0 && membersInside === 0 && (membersOutside > 0 || membersExitedPermanently > 0)) {
      overallStatus = 'FULLY_CHECKED_IN';
    } else if (checkedInMembers > 0) {
      overallStatus = 'PARTIALLY_CHECKED_IN';
    }

    const logs = this.store
      .find<any>('ticket_entry_logs', (l) => l.ticketId === ticket.id)
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    return {
      ticket: {
        ...ticket,
        totalMembers,
        entryStatus: overallStatus,
      },
      attendeeName: user ? user.name : 'Attendee',
      attendeeEmail: user ? user.email : '',
      eventName: event ? event.name || event.eventName : 'Event',
      members,
      totalMembers,
      checkedInMembers,
      remainingMembers: membersNotEntered,
      membersInside,
      membersOutside,
      membersNotEntered,
      membersExitedPermanently,
      status: overallStatus,
      logs,
    };
  }

  recordMemberAction(params: {
    eventId: string;
    ticketId: string;
    memberId: string;
    action: 'ENTRY' | 'EXIT' | 'RE_ENTRY' | 'PERMANENT_EXIT';
    coordinatorId: string;
    coordinatorName: string;
    notes?: string;
  }) {
    const { eventId, ticketId, memberId, action, coordinatorId, coordinatorName, notes } = params;
    const ticket = this.store.findById<any>('tickets', ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }
    if (ticket.eventId !== eventId) {
      throw new BadRequestException('Ticket does not belong to this event.');
    }
    if (ticket.registrationStatus === 'CANCELLED' || ticket.ticketStatus === 'CANCELLED') {
      throw new BadRequestException('This ticket has been cancelled. Venue entry is prohibited.');
    }
    if (ticket.paymentStatus !== 'CONFIRMED' && ticket.paymentStatus !== 'SUCCESS') {
      throw new BadRequestException('Ticket payment is not confirmed. Entry prohibited.');
    }

    const member = this.store.findById<any>('ticket_members', memberId);
    if (!member) {
      throw new NotFoundException('Member record not found on this ticket.');
    }
    if (member.ticketId !== ticketId) {
      throw new BadRequestException('Member does not belong to specified ticket.');
    }

    const currentStatus = member.entryStatus || 'NOT_ENTERED';
    let newStatus = currentStatus;

    if (action === 'ENTRY') {
      if (currentStatus === 'INSIDE') {
        throw new BadRequestException(`Member "${member.memberName}" is already INSIDE the venue.`);
      }
      if (currentStatus === 'OUTSIDE') {
        throw new BadRequestException(`Member "${member.memberName}" is currently OUTSIDE. Please record RE-ENTRY instead of initial Entry.`);
      }
      if (currentStatus === 'EXITED_PERMANENTLY') {
        throw new BadRequestException(`Member "${member.memberName}" has EXITED PERMANENTLY. Re-entry not allowed.`);
      }
      newStatus = 'INSIDE';
    } else if (action === 'EXIT') {
      if (currentStatus !== 'INSIDE') {
        throw new BadRequestException(`Member "${member.memberName}" is not inside the venue (Current status: ${currentStatus}).`);
      }
      newStatus = 'OUTSIDE';
    } else if (action === 'RE_ENTRY') {
      if (currentStatus === 'INSIDE') {
        throw new BadRequestException(`Member "${member.memberName}" is already INSIDE the venue.`);
      }
      if (currentStatus === 'NOT_ENTERED') {
        throw new BadRequestException(`Member "${member.memberName}" has not entered the venue yet. Please perform first Entry.`);
      }
      if (currentStatus === 'EXITED_PERMANENTLY') {
        throw new BadRequestException(`Member "${member.memberName}" has EXITED PERMANENTLY and is not permitted to re-enter.`);
      }
      newStatus = 'INSIDE';
    } else if (action === 'PERMANENT_EXIT') {
      if (currentStatus === 'NOT_ENTERED') {
        throw new BadRequestException(`Member "${member.memberName}" has not entered the venue yet.`);
      }
      if (currentStatus === 'EXITED_PERMANENTLY') {
        throw new BadRequestException(`Member "${member.memberName}" has already exited permanently.`);
      }
      newStatus = 'EXITED_PERMANENTLY';
    } else {
      throw new BadRequestException(`Invalid action "${action}". Allowed: ENTRY, EXIT, RE_ENTRY, PERMANENT_EXIT.`);
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Update member status
    this.store.update<any>('ticket_members', memberId, {
      entryStatus: newStatus,
      lastAction: action,
      lastActionAt: nowStr,
      firstEnteredAt: member.firstEnteredAt || (newStatus === 'INSIDE' ? nowStr : null),
      coordinatorId,
      coordinatorName,
      updatedAt: nowStr,
    });

    // 2. Create entry/exit audit log
    const logId = 'tel_' + crypto.randomBytes(8).toString('hex');
    this.store.create('ticket_entry_logs', {
      id: logId,
      ticketId,
      ticketNumber: ticket.ticketNumber,
      memberId,
      memberName: member.memberName,
      eventId,
      action,
      previousStatus: currentStatus,
      newStatus,
      coordinatorId,
      coordinatorName,
      timestamp: nowStr,
      notes: notes || null,
      createdAt: nowStr,
    });

    // 3. Recalculate and update parent ticket
    const allMembers = this.store.find<any>('ticket_members', (m) => m.ticketId === ticketId);
    const totalMembers = allMembers.length;
    const remainingMembers = allMembers.filter((m) => m.entryStatus === 'NOT_ENTERED').length;
    const membersInside = allMembers.filter((m) => m.entryStatus === 'INSIDE').length;
    const checkedInMembers = totalMembers - remainingMembers;

    let overallTicketStatus = 'NOT_ENTERED';
    if (remainingMembers === 0) {
      overallTicketStatus = 'FULLY_CHECKED_IN';
    } else if (checkedInMembers > 0) {
      overallTicketStatus = 'PARTIALLY_CHECKED_IN';
    }

    this.store.update<any>('tickets', ticketId, {
      checkedIn: checkedInMembers > 0 ? 1 : 0,
      checkedInAt: ticket.checkedInAt || (checkedInMembers > 0 ? nowStr : null),
      checkedInByUserId: coordinatorId,
      entryStatus: overallTicketStatus,
      updatedAt: nowStr,
    });

    return {
      message: `Action ${action} recorded successfully for ${member.memberName}.`,
      member: this.store.findById('ticket_members', memberId),
      ticketStatus: overallTicketStatus,
      totalMembers,
      checkedInMembers,
      remainingMembers,
      membersInside,
      log: this.store.findById('ticket_entry_logs', logId),
    };
  }

  getCoordinatorEventKpis(eventId: string) {
    const eventTickets = this.store.find<any>(
      'tickets',
      (t) => t.eventId === eventId && t.registrationStatus !== 'CANCELLED',
    );

    const totalTicketsSold = eventTickets.length;
    let totalRegisteredMembers = 0;
    let totalGroupTickets = 0;

    for (const t of eventTickets) {
      const qty = Math.max(1, Number(t.quantity || t.totalMembers || 1));
      totalRegisteredMembers += qty;
      if (qty > 1) {
        totalGroupTickets++;
      }
      this.ensureTicketMembersPopulated(t);
    }

    const allMembers = this.store.find<any>(
      'ticket_members',
      (m) => m.eventId === eventId && m.entryStatus !== 'CANCELLED',
    );

    const totalMembersInside = allMembers.filter((m) => m.entryStatus === 'INSIDE').length;
    const totalMembersOutside = allMembers.filter((m) => m.entryStatus === 'OUTSIDE').length;
    const totalMembersNotEntered = allMembers.filter((m) => m.entryStatus === 'NOT_ENTERED').length;

    const recentActivities = this.store
      .find<any>('ticket_entry_logs', (l) => l.eventId === eventId)
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, 15);

    return {
      totalTicketsSold,
      totalRegisteredMembers,
      totalMembersInside,
      totalMembersOutside,
      totalMembersNotEntered,
      totalGroupTickets,
      recentActivities,
    };
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
      const members = this.ensureTicketMembersPopulated(t);
      const totalMembers = Number(t.totalMembers || t.quantity || members.length || 1);
      const remainingMembers = members.filter((m) => m.entryStatus === 'NOT_ENTERED').length;
      const checkedInMembers = totalMembers - remainingMembers;
      let overallStatus = 'NOT_ENTERED';
      if (remainingMembers === 0) overallStatus = 'FULLY_CHECKED_IN';
      else if (checkedInMembers > 0) overallStatus = 'PARTIALLY_CHECKED_IN';

      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        ticketType: t.ticketType || (totalMembers > 1 ? 'Group Pass' : 'Standard'),
        checkedIn: t.checkedIn ? 1 : 0,
        checkedInAt: t.checkedInAt,
        attendeeName: user ? user.name : null,
        attendeeEmail: user ? user.email : null,
        totalMembers,
        checkedInMembers,
        remainingMembers,
        entryStatus: overallStatus,
        registrationStatus: t.registrationStatus || 'ACTIVE',
        members,
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
