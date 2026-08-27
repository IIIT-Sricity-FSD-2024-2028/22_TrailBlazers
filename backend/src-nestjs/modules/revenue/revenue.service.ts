import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RevenueRepository } from '../../repositories/revenue.repository';
import { QuotationsRepository } from '../../repositories/quotations.repository';

@Injectable()
export class RevenueService {
  constructor(
    private readonly revenueRepository: RevenueRepository,
    private readonly quotationsRepository: QuotationsRepository,
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
}
