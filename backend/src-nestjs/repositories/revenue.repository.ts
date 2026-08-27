import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import { NestLoggerService } from '../common/logging/logger.service';

@Injectable()
export class RevenueRepository {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  getDashboardMetrics() {
    const newRequests = this.store.count(
      'event_requests',
      (r) => r.status === 'SUBMITTED' || r.status === 'NEW',
    );

    const underReview = this.store.count(
      'event_requests',
      (r) => r.status === 'UNDER_REVIEW' || r.status === 'PRICING',
    );

    const pendingQuotes = this.store.count(
      'quotations',
      (q) => q.status === 'DRAFT' || q.status === 'SENT' || q.status === 'CHANGE_REQUESTED',
    );

    const acceptedQuotes = this.store.count(
      'quotations',
      (q) => q.status === 'ACCEPTED',
    );

    const qvAll = this.store.findAll<any>('quotation_versions');
    let totalQuotationValue = 0;
    let acceptedQuotationValue = 0;

    for (const qv of qvAll) {
      const amt = Number(qv.totalAmount) || 0;
      if (qv.status !== 'REJECTED') {
        totalQuotationValue += amt;
      }
      if (qv.status === 'ACCEPTED') {
        acceptedQuotationValue += amt;
      }
    }

    return {
      newRequests,
      underReview,
      pendingQuotes,
      acceptedQuotes,
      totalQuotationValue,
      acceptedQuotationValue,
    };
  }

  getPriorityRequests(limit = 10) {
    const reqs = this.store.findAll<any>('event_requests');

    const mapped = reqs.map((r) => {
      const q = this.store.findOne<any>('quotations', (q) => q.eventRequestId === r.id);
      let quotationValue = null;
      if (q) {
        const qv = this.store.findOne<any>(
          'quotation_versions',
          (v) => v.quotationId === q.id && Number(v.versionNumber) === Number(q.currentVersion),
        );
        if (qv) {
          quotationValue = qv.totalAmount;
        }
      }

      return {
        ...r,
        quotationId: q ? q.id : null,
        currentVersion: q ? q.currentVersion : null,
        quotationStatus: q ? q.status : null,
        quotationValue,
      };
    });

    return mapped
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, limit);
  }

  findEventRequests(filters: { search?: string; status?: string } = {}) {
    let reqs = this.store.findAll<any>('event_requests');
    const { search, status } = filters;

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      reqs = reqs.filter((r) => {
        const user = this.store.findById<any>('users', r.userId);
        const clientName = user ? user.name : '';
        return (
          (r.eventName && r.eventName.toLowerCase().includes(term)) ||
          (r.organizationName && r.organizationName.toLowerCase().includes(term)) ||
          (r.contactEmail && r.contactEmail.toLowerCase().includes(term)) ||
          (clientName && clientName.toLowerCase().includes(term))
        );
      });
    }

    if (status && status !== 'ALL') {
      reqs = reqs.filter((r) => r.status === status);
    }

    return reqs
      .map((r) => {
        const user = this.store.findById<any>('users', r.userId);
        return {
          ...r,
          clientName: user ? user.name : null,
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  findEventRequestDetailsById(id: string) {
    if (!id) return null;
    const r = this.store.findById<any>('event_requests', id);
    if (!r) return null;

    const user = this.store.findById<any>('users', r.userId);
    return {
      ...r,
      clientName: user ? user.name : null,
      clientEmail: user ? user.email : null,
      clientOrg: user ? user.organization : null,
    };
  }

  getAnalyticsStats() {
    const totalRequests = this.store.count('event_requests');
    const quotesCreated = this.store.count('quotations');
    const quotesSent = this.store.count('quotation_versions', (v) => v.status === 'SENT');
    const acceptedQuotes = this.store.count('quotation_versions', (v) => v.status === 'ACCEPTED');
    const rejectedQuotes = this.store.count('quotation_versions', (v) => v.status === 'REJECTED');
    const changeRequests = this.store.count('quotation_change_requests');

    const qvAll = this.store.findAll<any>('quotation_versions');
    let totalQuotationValue = 0;
    let acceptedQuotationValue = 0;
    let acceptedCount = 0;

    for (const qv of qvAll) {
      const amt = Number(qv.totalAmount) || 0;
      if (qv.status !== 'REJECTED') {
        totalQuotationValue += amt;
      }
      if (qv.status === 'ACCEPTED') {
        acceptedQuotationValue += amt;
        acceptedCount++;
      }
    }

    const averageAcceptedValue =
      acceptedCount > 0 ? Math.round(acceptedQuotationValue / acceptedCount) : 0;
    const conversionRate =
      quotesSent > 0 ? Math.round((acceptedQuotes / quotesSent) * 100) : 0;

    return {
      totalRequests,
      quotesCreated,
      quotesSent,
      acceptedQuotes,
      rejectedQuotes,
      changeRequests,
      totalQuotationValue,
      acceptedQuotationValue,
      averageAcceptedValue,
      conversionRate,
    };
  }

  getClientPortfolio() {
    const users = this.store.find<any>('users', (u) => u.role === 'CLIENT' || u.role === 'ATTENDEE');
    const portfolio: any[] = [];

    for (const u of users) {
      const reqs = this.store.find<any>('event_requests', (r) => r.userId === u.id);
      if (reqs.length === 0) continue;

      let acceptedQuotes = 0;
      let totalContractValue = 0;

      for (const r of reqs) {
        const q = this.store.findOne<any>('quotations', (q) => q.eventRequestId === r.id);
        if (q) {
          const qv = this.store.findOne<any>(
            'quotation_versions',
            (v) => v.quotationId === q.id && Number(v.versionNumber) === Number(q.currentVersion),
          );
          if (qv && qv.status === 'ACCEPTED') {
            acceptedQuotes++;
            totalContractValue += Number(qv.totalAmount) || 0;
          }
        }
      }

      portfolio.push({
        id: u.id,
        name: u.name,
        email: u.email,
        organization: u.organization,
        totalRequests: reqs.length,
        acceptedQuotes,
        totalContractValue,
      });
    }

    return portfolio.sort((a, b) => b.totalContractValue - a.totalContractValue);
  }

  findEventManagersWithAvailability(targetEventDate?: string, startTime?: string, endTime?: string) {
    const managers = this.store.find<any>('users', (u) => u.role === 'EVENT_MANAGER');

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

    return managers.map((m) => {
      const assignedReqs = this.store.find<any>(
        'event_requests',
        (r) =>
          r.eventManagerUserId === m.id &&
          r.status !== 'REJECTED' &&
          r.operationalStatus !== 'CANCELLED' &&
          r.operationalStatus !== 'COMPLETED',
      );

      const activeAssignmentsCount = assignedReqs.length;
      let isAvailable = true;
      let availabilityReason = 'Available for assignment';

      if (targetEventDate) {
        const sameDayReqs = assignedReqs.filter((r) => r.eventDate === targetEventDate);

        if (sameDayReqs.length > 0) {
          if (reqStartMin !== null && reqEndMin !== null) {
            // Check time slot overlap
            const conflictingEvent = sameDayReqs.find((r) => {
              const exStartMin = timeToMinutes(r.startTime);
              const exEndMin = timeToMinutes(r.endTime);
              if (exStartMin !== null && exEndMin !== null) {
                return exStartMin < reqEndMin && exEndMin > reqStartMin;
              }
              return true; // Assume overlap if existing event has no specific times
            });

            if (conflictingEvent) {
              isAvailable = false;
              availabilityReason = `Assigned to "${conflictingEvent.eventName}" on ${targetEventDate} (${conflictingEvent.startTime || 'All Day'})`;
            }
          } else {
            // Date-level conflict
            const conflictingEvent = sameDayReqs[0];
            isAvailable = false;
            availabilityReason = `Assigned to "${conflictingEvent.eventName}" on ${targetEventDate}`;
          }
        }
      }

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        department: m.department || 'Event Operations',
        organization: m.organization || 'Wavevents',
        activeAssignmentsCount,
        isAvailable,
        availabilityStatus: isAvailable ? 'Available' : 'Busy',
        availabilityReason,
        currentAssignments: assignedReqs.map((r) => ({
          id: r.id,
          eventName: r.eventName,
          eventDate: r.eventDate,
          timeSlot: r.timeSlot,
          venue: r.venue,
        })),
      };
    });
  }

  assignManager(eventRequestId: string, managerUserId: string, onsiteCoordinatorUserId?: string) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updates: any = {
      assignedManagerUserId: managerUserId,
      eventManagerUserId: managerUserId,
      operationalStatus: 'IN_PREPARATION',
      updatedAt: nowStr,
    };
    if (onsiteCoordinatorUserId) {
      updates.onsiteCoordinatorUserId = onsiteCoordinatorUserId;
    }
    return this.store.update<any>('event_requests', eventRequestId, updates);
  }
}
