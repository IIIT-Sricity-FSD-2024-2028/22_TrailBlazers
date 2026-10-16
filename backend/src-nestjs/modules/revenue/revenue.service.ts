import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { RevenueRepository } from '../../repositories/revenue.repository';
import { QuotationsRepository } from '../../repositories/quotations.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { InMemoryStore } from '../../repositories/in-memory.store';

@Injectable()
export class RevenueService {
  constructor(
    private readonly revenueRepository: RevenueRepository,
    private readonly quotationsRepository: QuotationsRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly store: InMemoryStore,
  ) {}

  getDashboard() {
    const metrics = this.revenueRepository.getDashboardMetrics();
    const priorityRequests = this.revenueRepository.getPriorityRequests(10);
    return { metrics, priorityRequests };
  }

  getEventRequests(filters: { search?: string; status?: string }) {
    const requests = this.revenueRepository.findEventRequests(filters);
    return { requests };
  }

  getEventRequestDetails(id: string) {
    const request = this.revenueRepository.findEventRequestDetailsById(id);
    if (!request) {
      throw new NotFoundException('Event request not found.');
    }

    const quotation =
      this.quotationsRepository.findQuotationByEventRequestId(id);
    let activeVersion: any = null;
    let lineItems: any[] = [];
    let versionHistory: any[] = [];
    let auditLogs: any[] = [];

    if (quotation) {
      activeVersion = this.quotationsRepository.findActiveVersion(
        quotation.id,
        quotation.currentVersion,
      );
      if (activeVersion) {
        lineItems = this.quotationsRepository.findLineItemsByVersionId(
          activeVersion.id,
        );
      }
      versionHistory = this.quotationsRepository.findVersionHistory(
        quotation.id,
      );
      auditLogs = this.quotationsRepository.findAuditLogs(quotation.id);
    }

    return {
      request,
      quotation,
      activeVersion,
      lineItems,
      versionHistory,
      auditLogs,
    };
  }

  getAnalytics() {
    const analytics = this.revenueRepository.getAnalyticsStats();
    return { analytics };
  }

  getClients() {
    const clients = this.revenueRepository.getClientPortfolio();
    return { clients };
  }

  getEventManagers(eventDate?: string) {
    const managers = this.revenueRepository.findEventManagersWithAvailability(eventDate);
    return { managers };
  }

  async assignManager(
    eventRequestId: string,
    managerUserId: string,
    onsiteCoordinatorUserId?: string,
  ) {
    const request = this.revenueRepository.findEventRequestDetailsById(eventRequestId);
    if (!request) {
      throw new NotFoundException('Event Request not found.');
    }

    const targetManager = this.revenueRepository
      .findEventManagersWithAvailability(request.eventDate, request.startTime, request.endTime)
      .find((m) => m.id === managerUserId);

    if (!targetManager) {
      throw new BadRequestException('Selected user is not an Event Manager.');
    }

    if (!targetManager.isAvailable && request.eventManagerUserId !== managerUserId) {
      throw new BadRequestException(`Cannot assign Event Manager: ${targetManager.availabilityReason}`);
    }

    const updated = this.revenueRepository.assignManager(
      eventRequestId,
      managerUserId,
      onsiteCoordinatorUserId,
    );
    return {
      success: true,
      message: `Event Manager ${targetManager.name} assigned successfully.`,
      request: updated,
    };
  }

  async escalateToManagement(eventRequestId: string, user: any) {
    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    const role = (user.role || '').toUpperCase();
    const isAuthorized =
      role === 'REVENUE' ||
      role === 'SUPER_ADMIN' ||
      (role === 'DEPARTMENT_MANAGER' &&
        (user.department === 'REVENUE' || user.department === 'EVENT_MANAGEMENT'));

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Access denied. Only Revenue Team or Super Admin can escalate events to Event Management.',
      );
    }

    const eventReq = this.store.findById<any>('event_requests', eventRequestId);
    if (!eventReq) {
      throw new NotFoundException('Event request not found.');
    }

    // 1. Verify quotation acceptance on the server
    const quotation = this.quotationsRepository.findQuotationByEventRequestId(eventRequestId);
    const isQuotationAccepted =
      quotation?.status === 'ACCEPTED' || eventReq.status === 'COMMERCIAL_APPROVED';

    if (!isQuotationAccepted) {
      throw new BadRequestException(
        'Cannot escalate event: Quotation has not been accepted by the client. Only events with accepted quotations are eligible for operational escalation.',
      );
    }

    // 2. Prevent duplicate escalation
    if (eventReq.escalatedToManagement) {
      throw new BadRequestException(
        'This event has already been escalated to Event Management.',
      );
    }

    // 3. Verify event is not already assigned
    if (eventReq.eventManagerUserId) {
      throw new BadRequestException(
        'Cannot escalate: An Event Manager is already assigned to this event.',
      );
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 4. Update event request in store
    const updated = this.store.update<any>('event_requests', eventRequestId, {
      escalatedToManagement: true,
      escalatedAt: nowStr,
      escalatedByUserId: user.id,
      escalatedByName: user.name || 'Revenue Specialist',
      operationalStatus: 'AWAITING_ASSIGNMENT',
      handoffStatus: 'ESCALATED_AWAITING_ASSIGNMENT',
      updatedAt: nowStr,
    });

    // 5. Audit trail
    if (quotation) {
      this.store.create('quotation_audit_logs', {
        id: `audit-${crypto.randomUUID()}`,
        quotationId: quotation.id,
        actorId: user.id,
        actorName: user.name || 'Revenue Specialist',
        action: 'ESCALATED_TO_EVENT_MANAGEMENT',
        details: `Revenue Team escalated event "${eventReq.eventName}" to Event Management Department Head for operational assignment.`,
        createdAt: nowStr,
      });
    }

    // 6. Persistent notification to Event Management Department Head
    const deptHead =
      this.store.findOne<any>(
        'users',
        (u) =>
          u.role === 'DEPARTMENT_MANAGER' &&
          u.department === 'EVENT_MANAGEMENT',
      ) || { id: 'usr_dept_mgr_event' };

    this.notificationHelper.createNotification({
      recipientUserId: deptHead.id,
      type: 'EVENT_ESCALATED_TO_MANAGEMENT',
      title: 'New Event Escalated',
      message: `The Revenue Team has escalated ${eventReq.eventName} for operational assignment.`,
      entityType: 'EVENT_REQUEST',
      entityId: eventReq.id,
      senderUserId: user.id,
      senderName: user.name || 'Revenue Specialist',
      senderRole: user.role || 'REVENUE',
      eventName: eventReq.eventName,
      deduplicate: true,
      status: 'POPUP_PENDING',
    });

    return {
      success: true,
      message: `Event "${eventReq.eventName}" successfully escalated to Event Management Department Head.`,
      request: updated,
    };
  }
}

