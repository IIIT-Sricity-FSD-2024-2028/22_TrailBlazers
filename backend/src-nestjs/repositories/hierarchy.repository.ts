import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import {
  getEventManagerMaxAssignedEvents,
  getEventManagerWorkloadThreshold,
  getEventManagerMaxCapacity,
} from '../common/constants/event-manager-capacity.constant';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  organization?: string;
  createdAt?: string;
}

export interface IssueRow {
  id: string;
  eventId: string;
  reporterUserId: string;
  reporterName?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedAt?: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  issueType: string;
  department: string;
  escalationLevel: number;
  escalatedAt?: string;
  escalationReason?: string;
  resolutionDetails?: string;
  resolverUserId?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class HierarchyRepository {
  constructor(private readonly store: InMemoryStore) {}

  getAllUsers(): UserRow[] {
    return this.store
      .find<UserRow>('users', (u) => u.role !== 'SPEAKER')
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        organization: u.organization,
      }));
  }

  getUserById(id: string): UserRow | null {
    if (!id) return null;
    const u = this.store.findById<UserRow>('users', id);
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      organization: u.organization,
      createdAt: u.createdAt,
    };
  }

  enrichMemberActivity(member: any): any {
    try {
      // 1. Check active operational or technical issue assigned to this member
      const assignedIssues = this.store.find<IssueRow>(
        'event_operational_issues',
        (i) => i.assignedUserId === member.id && i.status !== 'RESOLVED',
      );

      const activeIssuesCount = assignedIssues.length;

      if (assignedIssues.length > 0) {
        const statusPriority: Record<string, number> = {
          ESCALATED_TO_ADMIN: 1,
          ESCALATED_TO_MANAGER: 2,
          IN_PROGRESS: 3,
          OPEN: 4,
        };

        assignedIssues.sort((a, b) => {
          const pA = statusPriority[a.status] || 5;
          const pB = statusPriority[b.status] || 5;
          if (pA !== pB) return pA - pB;
          return (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt);
        });

        const issue = assignedIssues[0];
        const event = issue.eventId ? this.store.findById<any>('events', issue.eventId) : null;

        const isEscalated =
          issue.status === 'ESCALATED_TO_ADMIN' || issue.status === 'ESCALATED_TO_MANAGER';

        // Capacity rule for IT support staff: busy if escalated blocker or >= 5 active issues
        const isAvailable = !isEscalated && activeIssuesCount < 5;
        const availabilityStatus = isAvailable ? 'Available' : 'Busy';
        const availabilityReason = isEscalated
          ? 'Handling escalated issue'
          : !isAvailable
          ? `Capacity reached (${activeIssuesCount}/5 active issues)`
          : `Available (${activeIssuesCount}/5 active issues)`;

        return {
          ...member,
          status: isEscalated
            ? 'ESCALATED'
            : issue.status === 'IN_PROGRESS'
            ? 'IN_PROGRESS'
            : 'ACTIVE',
          isAvailable,
          availabilityStatus,
          availabilityReason,
          activeIssuesCount,
          activeAssignmentsCount: activeIssuesCount,
          currentActivity:
            issue.issueType === 'TECHNICAL'
              ? `Resolving Ticket: ${issue.category} (${issue.description})`
              : `Handling Operational Issue: ${issue.category} (${issue.description})`,
          eventName: event ? event.name : null,
          venue: event ? event.venue : null,
          priority: issue.priority || 'Medium',
          ticketId: issue.id,
          lastActivityAt: issue.updatedAt || issue.createdAt,
        };
      }

      // 2. Check active event request assignment
      const isEventManager = member.role === 'EVENT_MANAGER';
      const activeRequests = this.store.find<any>(
        'event_requests',
        (r) =>
          (isEventManager ? r.eventManagerUserId === member.id : r.onsiteCoordinatorUserId === member.id) &&
          r.status !== 'REJECTED' &&
          r.operationalStatus !== 'CANCELLED' &&
          (!r.operationalStatus || r.operationalStatus !== 'COMPLETED'),
      );

      if (activeRequests.length > 0) {
        activeRequests.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        const req = activeRequests[0];
        const maxCapacity = getEventManagerMaxAssignedEvents();
        const workloadThreshold = getEventManagerWorkloadThreshold();
        const managerWorkload = isEventManager ? this.getManagerWorkload(member.id) : null;
        const totalWorkload = managerWorkload ? managerWorkload.totalWorkload : activeRequests.length;

        let act = `Event Preparation & Operations for ${req.eventName}`;
        if (member.role === 'ONSITE_COORDINATOR') {
          act = `Managing Onsite Operations & Check-in for ${req.eventName}`;
        } else if (isEventManager) {
          act = `Event Planning & Coordination (${activeRequests.length}/${maxCapacity} active events, ${totalWorkload}/${workloadThreshold} workload)`;
        }

        // An Event Manager is Busy ONLY if they reached either hard constraint (7 events or 15 workload)
        // An Onsite Coordinator is NOT marked busy merely for having 1 event unless currently LIVE
        const isLive = activeRequests.some((r) => r.operationalStatus === 'LIVE');
        let isBusy = false;
        if (isEventManager) {
          isBusy = activeRequests.length >= maxCapacity || totalWorkload >= workloadThreshold;
        } else if (member.role === 'ONSITE_COORDINATOR') {
          isBusy = isLive;
        }

        return {
          ...member,
          status: isBusy ? 'IN_PROGRESS' : 'AVAILABLE',
          currentActivity: act,
          eventName: req.eventName,
          venue: req.venue,
          priority: null,
          ticketId: null,
          activeAssignmentsCount: activeRequests.length,
          maxCapacity: isEventManager ? maxCapacity : undefined,
          workloadThreshold: isEventManager ? workloadThreshold : undefined,
          totalWorkload: isEventManager ? totalWorkload : undefined,
          lastActivityAt: req.createdAt,
        };
      }

      // 3. Check Revenue / Commercial Proposal activity
      if (member.role === 'REVENUE' || member.department === 'REVENUE') {
        const quotes = this.store.find<any>(
          'quotations',
          (q) => q.assignedRevenueUserId === member.id || q.createdByUserId === member.id,
        );

        if (quotes.length > 0) {
          quotes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          const quote = quotes[0];
          const req = this.store.findById<any>('event_requests', quote.eventRequestId);
          const eventName = req ? req.eventName : 'Event';

          return {
            ...member,
            status: quote.status === 'ACCEPTED' ? 'IN_PROGRESS' : 'ACTIVE',
            currentActivity: `Finalized Commercial Proposal Review (${eventName})`,
            eventName,
            venue: null,
            priority: null,
            ticketId: null,
            lastActivityAt: quote.updatedAt || quote.createdAt,
          };
        }
      }

      // 4. Default Available state
      return {
        ...member,
        status: 'AVAILABLE',
        isAvailable: true,
        availabilityStatus: 'Available',
        availabilityReason: 'Available for assignment',
        activeIssuesCount: 0,
        activeAssignmentsCount: 0,
        currentActivity: 'No active assignment',
        eventName: null,
        venue: null,
        priority: null,
        ticketId: null,
        lastActivityAt: member.createdAt || null,
      };
    } catch (err) {
      console.error('Error enriching member activity:', err);
      return {
        ...member,
        status: 'AVAILABLE',
        isAvailable: true,
        availabilityStatus: 'Available',
        availabilityReason: 'Available for assignment',
        activeIssuesCount: 0,
        activeAssignmentsCount: 0,
        currentActivity: 'No active assignment',
        eventName: null,
        venue: null,
        priority: null,
        ticketId: null,
        lastActivityAt: null,
      };
    }
  }

  getIssueStats(): any {
    const total = this.store.count('event_operational_issues');
    const open = this.store.count(
      'event_operational_issues',
      (i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS',
    );
    const escalatedToManager = this.store.count(
      'event_operational_issues',
      (i) => i.status === 'ESCALATED_TO_MANAGER',
    );
    const escalatedToAdmin = this.store.count(
      'event_operational_issues',
      (i) => i.status === 'ESCALATED_TO_ADMIN',
    );
    const resolved = this.store.count(
      'event_operational_issues',
      (i) => i.status === 'RESOLVED',
    );

    return { total, open, escalatedToManager, escalatedToAdmin, resolved };
  }

  getRevenueEvents(): any[] {
    const reqs = this.store.findAll<any>('event_requests');
    const allTickets = this.store.findAll<any>('tickets');
    const allQuotations = this.store.findAll<any>('quotations');
    const allVersions = this.store.findAll<any>('quotation_versions');

    return reqs
      .map((r) => {
        const eventName = (r.eventName || r.name || '').toLowerCase().trim();

        // 1. Ticket Price
        const ticketPrice = Number(r.ticketPrice) || 0;

        // 2. Capacity
        const totalCapacity = Number(r.totalTickets || r.expectedAttendance) || 0;

        // 3. Dynamic Registered Tickets in Store (Actual Confirmed Tickets)
        const matchingTickets = allTickets.filter((t) => {
          if (t.eventId === r.id || t.eventId === r.requestId) return true;
          const linkedEvent = this.store.findById<any>('events', t.eventId);
          if (linkedEvent && (linkedEvent.name || '').toLowerCase().trim() === eventName) return true;
          const linkedReq = this.store.findById<any>('event_requests', t.eventId);
          if (linkedReq && (linkedReq.eventName || '').toLowerCase().trim() === eventName) return true;
          return false;
        });

        let ticketsSold = 0;
        let ticketSalesRevenue = 0;
        let refunds = 0;

        for (const t of matchingTickets) {
          const regStatus = (t.registrationStatus || t.status || '').toUpperCase();
          const payStatus = (t.paymentStatus || '').toUpperCase();

          if (regStatus === 'REFUNDED' || payStatus === 'REFUNDED') {
            const qty = Number(t.quantity) || 1;
            const unitP = Number(t.unitPrice) || ticketPrice;
            const subtotal = Number(t.subtotal || t.totalAmount) || (qty * unitP);
            refunds += subtotal;
            continue;
          }

          if (regStatus === 'CANCELLED' || payStatus === 'FAILED' || payStatus === 'PENDING') {
            continue;
          }

          const qty = Number(t.quantity) || 1;
          const unitP = Number(t.unitPrice) || ticketPrice;
          const subtotal = Number(t.subtotal || t.totalAmount) || (qty * unitP);
          ticketsSold += qty;
          ticketSalesRevenue += subtotal;
        }

        const netTicketSalesRevenue = Math.max(0, ticketSalesRevenue - refunds);

        // 4. Commercial Contract / Quotation Value
        let quotationValue = 0;
        let quotationId = null;
        let quotationStatus = null;
        let acceptedContractValue = 0;
        let clientPaymentsReceived = 0;

        const q = allQuotations.find((q) => q.eventRequestId === r.id || q.eventId === r.id);
        if (q) {
          quotationId = q.id;
          quotationStatus = q.status;
          const qv = allVersions.find(
            (v) => v.quotationId === q.id && Number(v.versionNumber) === Number(q.currentVersion),
          );
          if (qv && qv.totalAmount) {
            quotationValue = Number(qv.totalAmount) || 0;
          } else if (q.totalAmount) {
            quotationValue = Number(q.totalAmount) || 0;
          }

          if (q.status === 'ACCEPTED' || r.status === 'COMMERCIAL_APPROVED') {
            acceptedContractValue = quotationValue;
          }

          const qPayments = this.store.find<any>(
            'payments',
            (p) => (p.quotationId === q.id || p.eventRequestId === r.id) && p.status === 'SUCCESS',
          );
          clientPaymentsReceived = qPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        }

        const outstandingClientBalance = Math.max(0, acceptedContractValue - clientPaymentsReceived);
        const soldPercentage = totalCapacity > 0 ? Math.min(100, Math.round((ticketsSold / totalCapacity) * 100)) : 0;
        const client = this.store.findById<any>('users', r.userId);

        return {
          ...r,
          clientName: client ? client.name : (r.organizationName || 'Client'),
          quotationId,
          quotationStatus,
          quotationValue,
          acceptedContractValue,
          clientPaymentsReceived,
          outstandingClientBalance,
          commercialRevenue: acceptedContractValue,
          ticketPrice,
          totalCapacity,
          ticketsSold,
          ticketSalesRevenue,
          refunds,
          netTicketSalesRevenue,
          totalEventRevenue: acceptedContractValue + ticketSalesRevenue,
          soldPercentage,
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  getDetailedStaffActivity(search?: string, department?: string, roleFilter?: string): any[] {
    const allUsers = this.store.findAll<any>('users');
    const staffRoles = new Set([
      'SUPER_ADMIN',
      'DEPARTMENT_MANAGER',
      'EVENT_MANAGER',
      'ONSITE_COORDINATOR',
      'REVENUE',
      'IT_SUPPORT',
    ]);

    let staff = allUsers.filter(
      (u) => staffRoles.has(u.role) || (u.department && u.role !== 'ATTENDEE' && u.role !== 'SPEAKER'),
    );

    if (department && department !== 'ALL') {
      staff = staff.filter((s) => s.department === department);
    }

    if (roleFilter && roleFilter !== 'ALL') {
      staff = staff.filter((s) => s.role === roleFilter);
    }

    const allRequests = this.store.findAll<any>('event_requests');
    const allIssues = this.store.findAll<any>('event_operational_issues');
    const allQuotations = this.store.findAll<any>('quotations');
    const allAuditLogs = this.store.findAll<any>('event_operations_audit_logs');

    const enrichedStaff = staff.map((member) => {
      // 1. Assigned Events
      const assignedEvents = allRequests
        .filter((r) => {
          if (r.status === 'REJECTED') return false;
          if (r.eventManagerUserId === member.id) return true;
          if (r.onsiteCoordinatorUserId === member.id) return true;
          if (Array.isArray(r.onsiteCoordinatorUserIds) && r.onsiteCoordinatorUserIds.includes(member.id)) return true;
          if (r.assignedRevenueUserId === member.id) return true;
          return false;
        })
        .map((r) => {
          let roleInEvent = 'Staff';
          if (r.eventManagerUserId === member.id) roleInEvent = 'Event Manager';
          else if (r.onsiteCoordinatorUserId === member.id || (Array.isArray(r.onsiteCoordinatorUserIds) && r.onsiteCoordinatorUserIds.includes(member.id))) roleInEvent = 'Onsite Coordinator';
          else if (r.assignedRevenueUserId === member.id) roleInEvent = 'Revenue Specialist';

          return {
            id: r.id,
            eventName: r.eventName,
            eventDate: r.eventDate,
            time: `${r.startTime || ''} - ${r.endTime || ''}`.trim(),
            venue: r.venue || 'TBD',
            organizationName: r.organizationName || 'N/A',
            operationalStatus: r.operationalStatus || r.status || 'IN_PREPARATION',
            expectedAttendance: r.expectedAttendance || 0,
            roleInEvent,
          };
        });

      // 2. Assigned / Related Issues
      const assignedIssues = allIssues
        .filter((i) => {
          if (i.assignedUserId === member.id || i.reporterUserId === member.id) return true;
          if (member.role === 'IT_SUPPORT' && (i.department === 'IT_SUPPORT' || i.issueType === 'TECHNICAL')) return true;
          if (member.role === 'DEPARTMENT_MANAGER' && i.department === member.department) return true;
          return false;
        })
        .map((i) => ({
          id: i.id,
          category: i.category,
          issueType: i.issueType,
          priority: i.priority,
          status: i.status,
          description: i.description,
          escalationReason: i.escalationReason,
          reporterName: i.reporterName,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        }));

      // 3. Assigned / Handled Quotations
      const assignedQuotations = allQuotations
        .filter((q) => q.assignedRevenueUserId === member.id || q.createdByUserId === member.id)
        .map((q) => {
          const req = allRequests.find((r) => r.id === q.eventRequestId);
          return {
            id: q.id,
            eventRequestId: q.eventRequestId,
            eventName: req ? req.eventName : 'Event Proposal',
            totalAmount: q.totalAmount || 0,
            status: q.status,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
          };
        });

      // 4. Recent Operations Activity Logs
      const recentActions = allAuditLogs
        .filter((l) => l.actorUserId === member.id)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 5)
        .map((l) => ({
          id: l.id,
          action: l.action,
          details: l.details,
          createdAt: l.createdAt,
        }));

      // 5. Determine Current Real-Time Work Activity
      let status = 'AVAILABLE';
      let currentActivity = 'Available for assignment / Idle';

      const activeIssues = assignedIssues.filter((i) => i.status !== 'RESOLVED');
      const escalatedIssue = activeIssues.find((i) => i.status === 'ESCALATED_TO_ADMIN' || i.status === 'ESCALATED_TO_MANAGER');
      const activeEvents = assignedEvents.filter((e) => e.operationalStatus !== 'COMPLETED' && e.operationalStatus !== 'CANCELLED');
      const liveEvents = activeEvents.filter((e) => e.operationalStatus === 'LIVE');

      if (escalatedIssue) {
        status = 'ESCALATED';
        currentActivity = `Handling Escalated Issue: ${escalatedIssue.category} (${escalatedIssue.description})`;
      } else if (liveEvents.length > 0) {
        status = 'LIVE';
        currentActivity = `Conducting LIVE Onsite Operations for "${liveEvents[0].eventName}" at ${liveEvents[0].venue}`;
      } else if (activeEvents.length > 0) {
        status = 'IN_PROGRESS';
        const eventNames = activeEvents.map((e) => `"${e.eventName}"`).join(', ');
        if (member.role === 'EVENT_MANAGER') {
          currentActivity = `Event Preparation & Operations Planning for ${eventNames}`;
        } else if (member.role === 'ONSITE_COORDINATOR') {
          currentActivity = `Onsite Venue Logistics & Check-in Preparation for ${eventNames}`;
        } else {
          currentActivity = `Active on Event Operations for ${eventNames}`;
        }
      } else if (activeIssues.length > 0) {
        status = 'IN_PROGRESS';
        const topIssue = activeIssues[0];
        currentActivity = `Resolving Ticket: ${topIssue.category} (${topIssue.description})`;
      } else if (assignedQuotations.length > 0 && assignedQuotations.some((q) => q.status === 'DRAFT' || q.status === 'FINALIZED')) {
        status = 'IN_PROGRESS';
        const pendingQuote = assignedQuotations.find((q) => q.status === 'DRAFT' || q.status === 'FINALIZED');
        currentActivity = `Reviewing & Finalizing Commercial Proposal for "${pendingQuote?.eventName}"`;
      } else if (member.role === 'DEPARTMENT_MANAGER') {
        status = 'ACTIVE';
        currentActivity = `Department Leadership & Operations Oversight for ${member.department || 'Operations'}`;
      } else if (member.role === 'SUPER_ADMIN') {
        status = 'ACTIVE';
        currentActivity = 'System-wide Executive Administration & Operations Governance';
      }

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department || 'GENERAL',
        organization: member.organization || 'Wavevents',
        status,
        currentActivity,
        workload: {
          activeEventsCount: activeEvents.length,
          openIssuesCount: activeIssues.length,
          quotationsCount: assignedQuotations.length,
          recentActionsCount: recentActions.length,
        },
        assignedEvents,
        assignedIssues,
        assignedQuotations,
        recentActions,
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      return enrichedStaff.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.currentActivity.toLowerCase().includes(q),
      );
    }

    return enrichedStaff;
  }

  getDepartmentTeamRaw(role: string, dept: string): UserRow[] {
    return this.store
      .find<UserRow>(
        'users',
        (u) =>
          u.role !== 'SUPER_ADMIN' &&
          u.role !== 'DEPARTMENT_MANAGER' &&
          (role !== 'DEPARTMENT_MANAGER' || u.department === dept),
      )
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        organization: u.organization,
        createdAt: u.createdAt,
      }));
  }

  getIssuesForUser(role: string, userDept?: string, userId?: string): IssueRow[] {
    let issues = this.store.findAll<IssueRow>('event_operational_issues');

    if (role === 'SUPER_ADMIN') {
      const statusPriority: Record<string, number> = {
        ESCALATED_TO_ADMIN: 1,
        ESCALATED_TO_MANAGER: 2,
        OPEN: 3,
      };
      issues.sort((a, b) => {
        const pA = statusPriority[a.status] || 4;
        const pB = statusPriority[b.status] || 4;
        if (pA !== pB) return pA - pB;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
    } else if (role === 'DEPARTMENT_MANAGER') {
      const targetDept = userDept || 'EVENT_MANAGEMENT';
      issues = issues.filter((i) => i.department === targetDept);
      const statusPriority: Record<string, number> = {
        ESCALATED_TO_MANAGER: 1,
        OPEN: 2,
      };
      issues.sort((a, b) => {
        const pA = statusPriority[a.status] || 3;
        const pB = statusPriority[b.status] || 3;
        if (pA !== pB) return pA - pB;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
    } else if (role === 'IT_SUPPORT') {
      issues = issues
        .filter((i) => i.department === 'IT_SUPPORT' || i.issueType === 'TECHNICAL')
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } else {
      issues = issues
        .filter((i) => i.reporterUserId === userId || i.assignedUserId === userId)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    issues = issues.map((i) => {
      let assignedUserName = (i as any).assignedUserName;
      if (i.assignedUserId && !assignedUserName) {
        const u = this.store.findById<any>('users', i.assignedUserId);
        if (u) assignedUserName = u.name;
      }
      return {
        ...i,
        assignedUserName,
      };
    });

    return issues;
  }

  findIssueById(id: string): IssueRow | null {
    if (!id) return null;
    return this.store.findById<IssueRow>('event_operational_issues', id);
  }

  findFirstEventId(): string {
    const events = this.store.findAll<any>('events');
    return events.length > 0 ? events[0].id : 'evt-1';
  }

  createIssue(params: {
    id: string;
    eventId: string;
    reporterUserId: string;
    reporterName: string;
    category: string;
    priority: string;
    description: string;
    issueType: string;
    department: string;
    nowStr: string;
  }): IssueRow {
    const {
      id,
      eventId,
      reporterUserId,
      reporterName,
      category,
      priority,
      description,
      issueType,
      department,
      nowStr,
    } = params;

    const newIssue: IssueRow = {
      id,
      eventId,
      reporterUserId,
      reporterName,
      category,
      priority,
      description,
      status: 'OPEN',
      issueType,
      department,
      escalationLevel: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    this.store.create('event_operational_issues', newIssue);

    this.logAudit({
      eventId,
      userId: reporterUserId,
      action: 'ISSUE_CREATED',
      metadata: JSON.stringify({ issueId: id, category, priority, issueType }),
    });

    return this.findIssueById(id)!;
  }

  assignIssue(id: string, assignedUserId: string, assignedUserName?: string): boolean {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = this.store.update<IssueRow>('event_operational_issues', id, {
      assignedUserId,
      assignedUserName: assignedUserName || undefined,
      assignedAt: nowStr,
      status: 'IN_PROGRESS',
      updatedAt: nowStr,
    } as any);

    if (updated) {
      this.logAudit({
        eventId: updated.eventId,
        userId: assignedUserId,
        action: 'ISSUE_ASSIGNED',
        metadata: JSON.stringify({ issueId: id, assignedUserId, assignedUserName }),
      });
    }

    return !!updated;
  }

  escalateToManager(id: string, reason: string, nowStr: string): boolean {
    const updated = this.store.update<IssueRow>('event_operational_issues', id, {
      status: 'ESCALATED_TO_MANAGER',
      escalationLevel: 1,
      escalatedAt: nowStr,
      escalationReason: reason,
      updatedAt: nowStr,
    } as any);

    if (updated) {
      this.logAudit({
        eventId: updated.eventId,
        userId: updated.reporterUserId,
        action: 'ISSUE_ESCALATED_TO_MANAGER',
        metadata: JSON.stringify({ issueId: id, reason }),
      });
    }

    return !!updated;
  }

  escalateToAdmin(id: string, reason: string, nowStr: string): boolean {
    const updated = this.store.update<IssueRow>('event_operational_issues', id, {
      status: 'ESCALATED_TO_ADMIN',
      escalationLevel: 2,
      escalatedAt: nowStr,
      escalationReason: reason,
      updatedAt: nowStr,
    } as any);

    if (updated) {
      this.logAudit({
        eventId: updated.eventId,
        userId: updated.reporterUserId,
        action: 'ISSUE_ESCALATED_TO_ADMIN',
        metadata: JSON.stringify({ issueId: id, reason }),
      });
    }

    return !!updated;
  }

  resolveIssue(
    id: string,
    resolutionDetails: string,
    resolverUserId: string,
    nowStr: string,
  ): boolean {
    const updated = this.store.update<IssueRow>('event_operational_issues', id, {
      status: 'RESOLVED',
      resolutionDetails,
      resolverUserId,
      updatedAt: nowStr,
    } as any);

    if (updated) {
      this.logAudit({
        eventId: updated.eventId,
        userId: resolverUserId,
        action: 'ISSUE_RESOLVED',
        metadata: JSON.stringify({ issueId: id, resolutionDetails }),
      });
    }

    return !!updated;
  }

  findDepartmentManager(department: string): UserRow | null {
    const mgr = this.store.findOne<UserRow>(
      'users',
      (u) => u.role === 'DEPARTMENT_MANAGER' && u.department === department,
    );
    if (!mgr) return null;
    return { id: mgr.id, name: mgr.name, email: mgr.email, role: mgr.role };
  }

  findSuperAdmin(): UserRow | null {
    const admin = this.store.findOne<UserRow>('users', (u) => u.role === 'SUPER_ADMIN');
    if (!admin) return null;
    return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
  }

  getAwaitingAssignmentEvents(): any[] {
    return this.store.find<any>(
      'event_requests',
      (r) =>
        r.status === 'COMMERCIAL_APPROVED' &&
        r.escalatedToManagement === true &&
        !r.eventManagerUserId,
    );
  }

  getAssignedEvents(): any[] {
    return this.store.find<any>(
      'event_requests',
      (r) =>
        r.status === 'COMMERCIAL_APPROVED' &&
        r.eventManagerUserId !== null &&
        r.eventManagerUserId !== undefined &&
        r.eventManagerUserId !== '',
    );
  }

  findEventRequestById(id: string): any {
    return this.store.findById<any>('event_requests', id);
  }

  getManagerActiveAssignmentsCount(managerUserId: string, excludeEventId?: string): number {
    const assignedReqs = this.store.find<any>(
      'event_requests',
      (r) =>
        r.id !== excludeEventId &&
        r.eventManagerUserId === managerUserId &&
        r.status !== 'REJECTED' &&
        r.operationalStatus !== 'CANCELLED' &&
        r.operationalStatus !== 'COMPLETED',
    );
    return assignedReqs.length;
  }

  getManagerWorkload(managerUserId: string, excludeEventId?: string): {
    activeEventsCount: number;
    openIssuesCount: number;
    quotationsCount: number;
    totalWorkload: number;
  } {
    const activeEventsCount = this.getManagerActiveAssignmentsCount(managerUserId, excludeEventId);

    const assignedIssues = this.store.find<any>(
      'event_operational_issues',
      (i) => i.assignedUserId === managerUserId && i.status !== 'RESOLVED',
    );
    const openIssuesCount = assignedIssues.length;

    const quotations = this.store.find<any>(
      'quotations',
      (q) =>
        (q.assignedRevenueUserId === managerUserId || q.createdByUserId === managerUserId) &&
        (q.status === 'DRAFT' || q.status === 'FINALIZED' || q.status === 'SENT'),
    );
    const quotationsCount = quotations.length;

    const totalWorkload = activeEventsCount + openIssuesCount + quotationsCount;

    return {
      activeEventsCount,
      openIssuesCount,
      quotationsCount,
      totalWorkload,
    };
  }

  checkScheduleConflict(
    managerUserId: string,
    eventDate: string,
    startTime?: string,
    endTime?: string,
    excludeEventId?: string,
  ): any {
    const assignedReqs = this.store.find<any>(
      'event_requests',
      (r) =>
        r.id !== excludeEventId &&
        (r.eventManagerUserId === managerUserId ||
          r.assignedManagerUserId === managerUserId ||
          r.onsiteCoordinatorUserId === managerUserId ||
          (Array.isArray(r.onsiteCoordinatorUserIds) &&
            r.onsiteCoordinatorUserIds.includes(managerUserId))) &&
        r.eventDate === eventDate &&
        r.status !== 'REJECTED' &&
        r.operationalStatus !== 'CANCELLED' &&
        r.operationalStatus !== 'COMPLETED',
    );

    if (assignedReqs.length === 0) return null;

    const timeToMinutes = (tStr?: string) => {
      if (!tStr) return null;
      const isPM = /pm/i.test(tStr);
      const isAM = /am/i.test(tStr);
      const clean = tStr.replace(/(am|pm)/i, '').trim();
      const parts = clean.split(':');
      let h = parseInt(parts[0] || '0', 10);
      const m = parseInt(parts[1] || '0', 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      return h * 60 + m;
    };

    const reqStartMin = timeToMinutes(startTime);
    const reqEndMin = timeToMinutes(endTime);

    if (reqStartMin !== null && reqEndMin !== null) {
      return assignedReqs.find((r) => {
        const exStartMin = timeToMinutes(r.startTime);
        const exEndMin = timeToMinutes(r.endTime);
        if (exStartMin !== null && exEndMin !== null) {
          return exStartMin < reqEndMin && exEndMin > reqStartMin;
        }
        return true;
      }) || null;
    }

    return assignedReqs[0];
  }

  findStaffWithAvailability(targetEventDate?: string, startTime?: string, endTime?: string): any[] {
    const staff = this.store.find<any>('users', (u) => u.role === 'EVENT_MANAGER' || u.role === 'ONSITE_COORDINATOR');
    const maxCapacity = getEventManagerMaxAssignedEvents();
    const workloadThreshold = getEventManagerWorkloadThreshold();

    const timeToMinutes = (tStr?: string) => {
      if (!tStr) return null;
      const isPM = /pm/i.test(tStr);
      const isAM = /am/i.test(tStr);
      const clean = tStr.replace(/(am|pm)/i, '').trim();
      const parts = clean.split(':');
      let h = parseInt(parts[0] || '0', 10);
      const m = parseInt(parts[1] || '0', 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      return h * 60 + m;
    };

    const reqStartMin = timeToMinutes(startTime);
    const reqEndMin = timeToMinutes(endTime);

    return staff.map((s) => {
      const isEventManager = s.role === 'EVENT_MANAGER';
      const assignedReqs = this.store.find<any>(
        'event_requests',
        (r) =>
          (isEventManager ? r.eventManagerUserId === s.id : r.onsiteCoordinatorUserId === s.id) &&
          r.status !== 'REJECTED' &&
          r.operationalStatus !== 'CANCELLED' &&
          r.operationalStatus !== 'COMPLETED',
      );

      const activeAssignmentsCount = assignedReqs.length;
      const managerWorkload = isEventManager ? this.getManagerWorkload(s.id) : null;
      const totalWorkload = managerWorkload ? managerWorkload.totalWorkload : activeAssignmentsCount;

      let isAvailable = true;
      let availabilityReason = 'Available for assignment';

      // 1. Capacity Rule B (Maximum Capacity): manager is Busy when active events >= maxCapacity (7)
      if (isEventManager && activeAssignmentsCount >= maxCapacity) {
        isAvailable = false;
        availabilityReason = `Event limit reached (${activeAssignmentsCount}/${maxCapacity} active events)`;
      } else if (isEventManager && totalWorkload >= workloadThreshold) {
        // 2. Capacity Rule A (Workload Threshold): manager is Busy when totalWorkload >= workloadThreshold (15)
        isAvailable = false;
        availabilityReason = `Workload threshold reached (${totalWorkload}/${workloadThreshold} workload points)`;
      } else if (targetEventDate) {
        // 3. Date / Time Slot Conflict Rule
        const sameDayReqs = assignedReqs.filter((r) => r.eventDate === targetEventDate);

        if (sameDayReqs.length > 0) {
          if (reqStartMin !== null && reqEndMin !== null) {
            const conflictingEvent = sameDayReqs.find((r) => {
              const exStartMin = timeToMinutes(r.startTime);
              const exEndMin = timeToMinutes(r.endTime);
              if (exStartMin !== null && exEndMin !== null) {
                return exStartMin < reqEndMin && exEndMin > reqStartMin;
              }
              return true;
            });

            if (conflictingEvent) {
              isAvailable = false;
              availabilityReason = `Assigned to "${conflictingEvent.eventName}" on ${targetEventDate} (${conflictingEvent.startTime || 'All Day'})`;
            }
          } else {
            const conflictingEvent = sameDayReqs[0];
            isAvailable = false;
            availabilityReason = `Assigned to "${conflictingEvent.eventName}" on ${targetEventDate}`;
          }
        }
      }

      if (isAvailable) {
        if (isEventManager) {
          availabilityReason = `Available (${activeAssignmentsCount}/${maxCapacity} active events, ${totalWorkload}/${workloadThreshold} workload)`;
        } else if (activeAssignmentsCount > 0) {
          availabilityReason = `Available (${activeAssignmentsCount} active events)`;
        }
      }

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        department: s.department || 'Event Management',
        organization: s.organization || 'Wavevents',
        activeAssignmentsCount,
        maxCapacity: isEventManager ? maxCapacity : undefined,
        workloadThreshold: isEventManager ? workloadThreshold : undefined,
        totalWorkload: isEventManager ? totalWorkload : undefined,
        isAvailable,
        availabilityStatus: isAvailable ? 'Available' : 'Busy',
        availabilityReason,
      };
    });
  }

  assignStaff(eventRequestId: string, eventManagerUserId?: string, onsiteCoordinatorUserId?: string): any {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const patch: any = { updatedAt: nowStr };

    if (eventManagerUserId !== undefined) {
      patch.eventManagerUserId = eventManagerUserId || null;
      patch.assignedManagerUserId = eventManagerUserId || null;
    }
    if (onsiteCoordinatorUserId !== undefined) {
      patch.onsiteCoordinatorUserId = onsiteCoordinatorUserId || null;
      patch.onsiteCoordinatorUserIds = onsiteCoordinatorUserId ? [onsiteCoordinatorUserId] : [];
    }

    const existing = this.store.findById<any>('event_requests', eventRequestId);
    const finalMgr = eventManagerUserId !== undefined ? eventManagerUserId : (existing ? existing.eventManagerUserId : null);
    const finalCoord = onsiteCoordinatorUserId !== undefined ? onsiteCoordinatorUserId : (existing ? existing.onsiteCoordinatorUserId : null);

    if (finalMgr) {
      patch.operationalStatus = 'IN_PREPARATION';
    } else {
      patch.operationalStatus = 'AWAITING_ASSIGNMENT';
    }

    const updated = this.store.update<any>('event_requests', eventRequestId, patch);

    if (updated) {
      this.store.update<any>('events', eventRequestId, {
        organizerUserId: finalMgr || null,
        onsiteCoordinatorUserId: finalCoord || null,
        onsiteCoordinatorUserIds: finalCoord ? [finalCoord] : [],
        operationalStatus: patch.operationalStatus,
        updatedAt: nowStr,
      });
    }

    return updated;
  }


  getEventAttendees(
    eventId: string,
    query?: {
      search?: string;
      status?: string;
      ticketStatus?: string;
      checkedIn?: string;
    },
  ) {
    if (!eventId || !eventId.trim()) {
      return null;
    }

    const trimmedId = eventId.trim();

    // 1. Resolve event details from event_requests or events
    const req =
      this.store.findById<any>('event_requests', trimmedId) ||
      this.store.findOne<any>(
        'event_requests',
        (r) => r.requestId === trimmedId || r.id === trimmedId,
      );
    const pubEvent =
      this.store.findById<any>('events', trimmedId) ||
      this.store.findOne<any>('events', (e) => e.id === trimmedId);

    if (!req && !pubEvent) {
      return null;
    }

    const eventName = (pubEvent?.name || req?.eventName || req?.name || '').trim();
    const eventNameLower = eventName.toLowerCase();

    // Collect candidate identifiers matching this event
    const candidateIds = new Set<string>();
    candidateIds.add(trimmedId);
    if (req?.id) candidateIds.add(req.id);
    if (req?.requestId) candidateIds.add(req.requestId);
    if (pubEvent?.id) candidateIds.add(pubEvent.id);

    if (eventNameLower) {
      const allReqs = this.store.findAll<any>('event_requests');
      for (const r of allReqs) {
        if ((r.eventName || r.name || '').toLowerCase().trim() === eventNameLower) {
          candidateIds.add(r.id);
          if (r.requestId) candidateIds.add(r.requestId);
        }
      }
      const allEvents = this.store.findAll<any>('events');
      for (const e of allEvents) {
        if ((e.name || '').toLowerCase().trim() === eventNameLower) {
          candidateIds.add(e.id);
        }
      }
    }

    // 2. Find all tickets that belong strictly to this event
    const allTickets = this.store.findAll<any>('tickets');
    const matchingTickets = allTickets.filter((t) => {
      if (candidateIds.has(t.eventId)) return true;
      const linkedEvent = this.store.findById<any>('events', t.eventId);
      if (linkedEvent && (linkedEvent.name || '').toLowerCase().trim() === eventNameLower) {
        return true;
      }
      const linkedReq = this.store.findById<any>('event_requests', t.eventId);
      if (linkedReq && (linkedReq.eventName || '').toLowerCase().trim() === eventNameLower) {
        return true;
      }
      return false;
    });

    // 3. Compute accurate summary statistics from all registrations
    const totalRegistrations = matchingTickets.length;
    let totalTicketsIssued = 0;
    let confirmedRegistrations = 0;
    let pendingRegistrations = 0;
    let cancelledRegistrations = 0;
    let checkedInCount = 0;
    let checkedInTickets = 0;

    for (const t of matchingTickets) {
      const qty = Number(t.quantity) || 1;
      totalTicketsIssued += qty;

      const regStatus = (t.registrationStatus || t.status || '').toUpperCase();
      const payStatus = (t.paymentStatus || '').toUpperCase();
      const isCheckedIn = t.checkedIn === 1 || t.checkedIn === true;

      if (isCheckedIn) {
        checkedInCount += 1;
        checkedInTickets += qty;
      }

      if (regStatus === 'CANCELLED' || payStatus === 'REFUNDED' || regStatus === 'REFUNDED') {
        cancelledRegistrations += 1;
      } else if (regStatus === 'ACTIVE' || regStatus === 'CONFIRMED' || payStatus === 'CONFIRMED' || payStatus === 'SUCCESS') {
        confirmedRegistrations += 1;
      } else if (payStatus === 'PENDING' || regStatus === 'PENDING') {
        pendingRegistrations += 1;
      } else {
        confirmedRegistrations += 1;
      }
    }

    // 4. Transform matching tickets into attendee records with user enrichment
    let attendees = matchingTickets.map((t) => {
      const user = this.store.findById<any>('users', t.userId);
      const isCheckedIn = t.checkedIn === 1 || t.checkedIn === true;
      const regStatus = (t.registrationStatus || t.status || (t.paymentStatus === 'CONFIRMED' ? 'ACTIVE' : 'PENDING')).toUpperCase();

      return {
        id: t.id,
        ticketId: t.id,
        ticketNumber: t.ticketNumber || t.id,
        registrationId: t.ticketNumber || t.id,
        userId: t.userId,
        attendeeName: user?.name || t.attendeeName || (t.ticketNumber ? `Attendee (${t.ticketNumber})` : 'Registered Attendee'),
        attendeeEmail: user?.email || t.attendeeEmail || 'N/A',
        organization: user?.organization || user?.company || null,
        ticketType: t.ticketType || 'Standard',
        quantity: Number(t.quantity) || 1,
        unitPrice: Number(t.unitPrice) || 0,
        subtotal: Number(t.subtotal) || 0,
        platformFee: Number(t.platformFee) || 0,
        totalAmount: Number(t.totalAmount) || 0,
        paymentStatus: (t.paymentStatus || 'CONFIRMED').toUpperCase(),
        ticketStatus: regStatus,
        registrationStatus: regStatus,
        checkedIn: isCheckedIn,
        checkedInAt: t.checkedInAt || null,
        registrationDate: t.createdAt || 'N/A',
        createdAt: t.createdAt || 'N/A',
      };
    });

    // 5. Apply Super Admin Search and Filters
    if (query?.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      attendees = attendees.filter((a) =>
        (a.attendeeName && a.attendeeName.toLowerCase().includes(term)) ||
        (a.attendeeEmail && a.attendeeEmail.toLowerCase().includes(term)) ||
        (a.ticketNumber && a.ticketNumber.toLowerCase().includes(term)) ||
        (a.ticketId && a.ticketId.toLowerCase().includes(term)) ||
        (a.registrationId && a.registrationId.toLowerCase().includes(term))
      );
    }

    if (query?.status && query.status.toUpperCase() !== 'ALL') {
      const filterStatus = query.status.trim().toUpperCase();
      attendees = attendees.filter(
        (a) => a.registrationStatus === filterStatus || a.paymentStatus === filterStatus,
      );
    }

    if (query?.ticketStatus && query.ticketStatus.toUpperCase() !== 'ALL') {
      const filterTktStatus = query.ticketStatus.trim().toUpperCase();
      attendees = attendees.filter((a) => a.ticketStatus === filterTktStatus);
    }

    if (query?.checkedIn && query.checkedIn.toUpperCase() !== 'ALL') {
      const filterCheckin = query.checkedIn.trim().toUpperCase();
      if (filterCheckin === 'CHECKED_IN' || filterCheckin === 'TRUE' || filterCheckin === '1') {
        attendees = attendees.filter((a) => a.checkedIn === true);
      } else if (filterCheckin === 'NOT_CHECKED_IN' || filterCheckin === 'FALSE' || filterCheckin === '0') {
        attendees = attendees.filter((a) => a.checkedIn === false);
      }
    }

    // Sort newest registrations first
    attendees.sort((a, b) => (b.registrationDate || '').localeCompare(a.registrationDate || ''));

    // 6. Return structured response
    return {
      event: {
        id: req?.id || pubEvent?.id || trimmedId,
        eventId: req?.requestId || pubEvent?.id || trimmedId,
        eventName: eventName || 'Event Details',
        organizationName: req?.organizationName || pubEvent?.organizationName || 'Wavevents Partner',
        contactEmail: req?.contactEmail || null,
        category: req?.category || pubEvent?.category || 'General',
        eventDate: req?.eventDate || pubEvent?.date || 'Upcoming',
        startTime: req?.startTime || pubEvent?.startTime || '09:00 AM',
        endTime: req?.endTime || pubEvent?.endTime || '05:00 PM',
        venue: req?.venue || pubEvent?.venue || 'Main Venue',
        location: req?.location || pubEvent?.location || 'India',
        totalCapacity: Number(req?.expectedAttendance || pubEvent?.totalTickets) || 100,
        ticketPrice: Number(req?.ticketPrice || pubEvent?.ticketPrice) || 0,
        operationalStatus: req?.operationalStatus || pubEvent?.status || 'ACTIVE',
      },
      summary: {
        totalRegistrations,
        totalTicketsIssued,
        confirmedRegistrations,
        pendingRegistrations,
        cancelledRegistrations,
        checkedInCount,
        checkedInTickets,
      },
      attendees,
    };
  }

  logAudit(params: {
    eventId?: string;
    userId?: string;
    action: string;
    metadata?: string;
  }) {
    try {
      const id = 'aud_' + Math.random().toString(36).substring(2, 10);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      this.store.create('event_operations_audit_logs', {
        id,
        eventId: params.eventId || null,
        userId: params.userId || null,
        actorUserId: params.userId || 'system',
        actorName: 'Staff Member',
        actorRole: 'STAFF',
        action: params.action,
        details: params.metadata || null,
        createdAt: nowStr,
      });
    } catch (e) {
      // Audit log failures caught gracefully
    }
  }
}
