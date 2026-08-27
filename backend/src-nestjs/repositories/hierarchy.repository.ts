import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

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
      // 1. Check active operational or technical issue
      const activeIssues = this.store.find<IssueRow>(
        'event_operational_issues',
        (i) =>
          (i.assignedUserId === member.id || i.reporterUserId === member.id) &&
          i.status !== 'RESOLVED',
      );

      if (activeIssues.length > 0) {
        const statusPriority: Record<string, number> = {
          ESCALATED_TO_ADMIN: 1,
          ESCALATED_TO_MANAGER: 2,
          IN_PROGRESS: 3,
          OPEN: 4,
        };

        activeIssues.sort((a, b) => {
          const pA = statusPriority[a.status] || 5;
          const pB = statusPriority[b.status] || 5;
          if (pA !== pB) return pA - pB;
          return (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt);
        });

        const issue = activeIssues[0];
        const event = issue.eventId ? this.store.findById<any>('events', issue.eventId) : null;

        const isEscalated =
          issue.status === 'ESCALATED_TO_ADMIN' || issue.status === 'ESCALATED_TO_MANAGER';

        return {
          ...member,
          status: isEscalated
            ? 'ESCALATED'
            : issue.status === 'IN_PROGRESS'
            ? 'IN_PROGRESS'
            : 'ACTIVE',
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
      const activeRequests = this.store.find<any>(
        'event_requests',
        (r) =>
          (r.eventManagerUserId === member.id || r.onsiteCoordinatorUserId === member.id) &&
          r.status !== 'REJECTED' &&
          (!r.operationalStatus || r.operationalStatus !== 'COMPLETED'),
      );

      if (activeRequests.length > 0) {
        activeRequests.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        const req = activeRequests[0];
        let act = `Event Preparation & Operations for ${req.eventName}`;
        if (member.role === 'ONSITE_COORDINATOR') {
          act = `Managing Onsite Operations & Check-in for ${req.eventName}`;
        } else if (member.role === 'EVENT_MANAGER') {
          act = `Event Planning & Coordination for ${req.eventName}`;
        }
        return {
          ...member,
          status: 'IN_PROGRESS',
          currentActivity: act,
          eventName: req.eventName,
          venue: req.venue,
          priority: null,
          ticketId: null,
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

  assignIssue(id: string, assignedUserId: string): boolean {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = this.store.update<IssueRow>('event_operational_issues', id, {
      assignedUserId,
      status: 'IN_PROGRESS',
      updatedAt: nowStr,
    } as any);

    if (updated) {
      this.logAudit({
        eventId: updated.eventId,
        userId: assignedUserId,
        action: 'ISSUE_ASSIGNED',
        metadata: JSON.stringify({ issueId: id, assignedUserId }),
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
