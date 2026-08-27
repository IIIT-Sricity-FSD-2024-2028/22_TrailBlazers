import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { QuotationsRepository } from '../../repositories/quotations.repository';
import { RevenueRepository } from '../../repositories/revenue.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { NestLoggerService } from '../../common/logging/logger.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly quotationsRepository: QuotationsRepository,
    private readonly revenueRepository: RevenueRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly logger: NestLoggerService,
  ) {}

  async createQuotation(dto: CreateQuotationDto, user: any) {
    const {
      eventRequestId,
      lineItems = [],
      discount = 0,
      taxPercent = 18,
      notes = '',
      terms = '',
    } = dto;
    const actorUserId = user.id;
    const actorName = user.name || 'Revenue Specialist';

    if (!eventRequestId) {
      throw new BadRequestException('Event Request ID is required.');
    }

    const eventReq =
      this.revenueRepository.findEventRequestDetailsById(eventRequestId);
    if (!eventReq) {
      throw new NotFoundException('Event request not found.');
    }

    let subtotal = 0;
    const validItems = (lineItems || []).map((item: any, idx: number) => {
      const qty = Math.max(1, Number(item.quantity || 1));
      const price = Math.max(0, Number(item.unitPrice || 0));
      const itemSubtotal = qty * price;
      subtotal += itemSubtotal;
      return {
        id: 'qli_' + crypto.randomBytes(8).toString('hex'),
        description: item.description || `Service Item #${idx + 1}`,
        quantity: qty,
        unitPrice: price,
        subtotal: itemSubtotal,
      };
    });

    const numDiscount = Math.max(0, Number(discount || 0));
    const numTaxPercent = Math.max(0, Number(taxPercent || 0));
    const taxableBase = Math.max(0, subtotal - numDiscount);
    const taxAmount = Math.round((taxableBase * numTaxPercent) / 100);
    const totalAmount = taxableBase + taxAmount;

    const existingQuotation =
      this.quotationsRepository.findQuotationByEventRequestId(eventRequestId);
    if (existingQuotation && existingQuotation.status === 'FINALIZED') {
      throw new BadRequestException(
        'This quotation is finalized and cannot be modified.',
      );
    }

    const qtnId = existingQuotation
      ? existingQuotation.id
      : 'qtn_' + crypto.randomBytes(8).toString('hex');
    const versionNumber = existingQuotation
      ? existingQuotation.currentVersion + 1
      : 1;
    const versionId = 'qver_' + crypto.randomBytes(8).toString('hex');
    const auditLogId = 'qlog_' + crypto.randomBytes(8).toString('hex');

    const result = this.quotationsRepository.saveQuotationTransaction({
      eventRequestId,
      actorUserId,
      actorName,
      existingQuotation,
      validItems,
      subtotal,
      numDiscount,
      numTaxPercent,
      taxAmount,
      totalAmount,
      notes,
      terms,
      qtnId,
      versionId,
      versionNumber,
      auditLogId,
    });

    const createdVersion = this.quotationsRepository.findActiveVersion(
      result.qtnId,
      result.versionNumber,
    );
    const createdItems = this.quotationsRepository.findLineItemsByVersionId(
      result.versionId,
    );

    return {
      message: `Quotation Version V${result.versionNumber} generated and finalized successfully.`,
      quotationId: result.qtnId,
      version: createdVersion,
      lineItems: createdItems,
    };
  }

  async sendQuotation(id: string, user: any) {
    const actorUserId = user.id;
    const actorName = user.name || 'Revenue Specialist';

    const quotation = this.quotationsRepository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException('Quotation not found.');
    }

    const activeVersion = this.quotationsRepository.findActiveVersion(
      id,
      quotation.currentVersion,
    );
    if (!activeVersion) {
      throw new NotFoundException('Quotation version not found.');
    }

    const auditLogId = 'qlog_' + crypto.randomBytes(8).toString('hex');

    this.quotationsRepository.sendQuotationTransaction({
      quotationId: id,
      activeVersionId: activeVersion.id,
      eventRequestId: quotation.eventRequestId,
      versionNumber: activeVersion.versionNumber,
      totalAmount: activeVersion.totalAmount,
      actorUserId,
      actorName,
      auditLogId,
    });

    // Notify Client
    try {
      const eventReq =
        this.revenueRepository.findEventRequestDetailsById(
          quotation.eventRequestId,
        );
      if (eventReq && eventReq.userId) {
        this.notificationHelper.createNotification({
          recipientUserId: eventReq.userId,
          type: 'QUOTATION_SENT',
          title: 'Finalized Quotation Available',
          message: `${actorName} (Revenue Team) issued a finalized commercial quotation for your event "${eventReq.eventName}".`,
          entityType: 'QUOTATION',
          entityId: id,
          senderUserId: actorUserId,
          senderName: actorName,
          senderRole: 'Revenue Team',
          eventName: eventReq.eventName,
          deduplicate: true,
        });
      }
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch QUOTATION_SENT notification',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'QUOTATIONS_SERVICE',
      );
    }

    return {
      message: `Quotation V${activeVersion.versionNumber} is finalized and visible to client.`,
      status: 'FINALIZED',
    };
  }

  async getClientQuotation(eventRequestId: string, userId: string) {
    const eventReq =
      this.revenueRepository.findEventRequestDetailsById(eventRequestId);
    if (!eventReq) {
      throw new NotFoundException('Event request not found.');
    }

    if (eventReq.userId !== userId) {
      throw new ForbiddenException(
        'Access denied. You can only view quotations belonging to your own event requests.',
      );
    }

    const quotation =
      this.quotationsRepository.findQuotationByEventRequestId(eventRequestId);
    if (!quotation) {
      throw new NotFoundException(
        'No quotation has been generated for this event request yet.',
      );
    }

    const activeVersion = this.quotationsRepository.findActiveVersion(
      quotation.id,
      quotation.currentVersion,
    );
    const lineItems = activeVersion
      ? this.quotationsRepository.findLineItemsByVersionId(activeVersion.id)
      : [];
    const versionHistory = this.quotationsRepository.findVersionHistory(
      quotation.id,
    );
    const changeRequests = this.quotationsRepository.findChangeRequests(
      quotation.id,
    );

    return {
      quotation,
      activeVersion,
      lineItems,
      versionHistory,
      changeRequests,
    };
  }

  async acceptQuotation(id: string, userId: string) {
    let quotation = this.quotationsRepository.findQuotationById(id);
    if (!quotation) {
      quotation =
        this.quotationsRepository.findQuotationByEventRequestId(id);
    }

    if (!quotation) {
      throw new NotFoundException('Quotation not found.');
    }

    const eventReq =
      this.revenueRepository.findEventRequestDetailsById(
        quotation.eventRequestId,
      );
    if (!eventReq) {
      throw new NotFoundException('Associated event request not found.');
    }

    if (eventReq.userId !== userId) {
      throw new ForbiddenException(
        'Access denied. You can only approve quotations for your own event requests.',
      );
    }

    if (quotation.status === 'ACCEPTED') {
      return {
        message: 'Quotation has already been approved.',
        status: 'ACCEPTED',
      };
    }

    const activeVer = this.quotationsRepository.findActiveVersion(
      quotation.id,
      quotation.currentVersion,
    );
    const contractPrice = activeVer ? activeVer.totalAmount : eventReq.budget;

    this.quotationsRepository.acceptQuotationTransaction({
      quotationId: quotation.id,
      currentVersion: quotation.currentVersion,
      eventReq,
      contractPrice,
    });

    // Notify Event Manager if assigned
    try {
      if (eventReq.eventManagerUserId) {
        this.notificationHelper.createNotification({
          recipientUserId: eventReq.eventManagerUserId,
          type: 'EVENT_READY_FOR_PREPARATION',
          title: 'Event Ready for Preparation',
          message: `Client approved the quotation for "${eventReq.eventName}".`,
          entityType: 'EVENT_REQUEST',
          entityId: eventReq.id,
        });
      }
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch EVENT_READY_FOR_PREPARATION notification',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'QUOTATIONS_SERVICE',
      );
    }

    return {
      message: 'Quotation approved successfully.',
      status: 'ACCEPTED',
    };
  }

  async rejectQuotation(id: string, userId: string) {
    let quotation = this.quotationsRepository.findQuotationById(id);
    if (!quotation) {
      quotation =
        this.quotationsRepository.findQuotationByEventRequestId(id);
    }

    if (!quotation) {
      throw new NotFoundException('Quotation not found.');
    }

    const eventReq =
      this.revenueRepository.findEventRequestDetailsById(
        quotation.eventRequestId,
      );
    if (!eventReq) {
      throw new NotFoundException('Associated event request not found.');
    }

    if (eventReq.userId !== userId) {
      throw new ForbiddenException(
        'Access denied. You can only reject quotations for your own event requests.',
      );
    }

    this.quotationsRepository.rejectQuotationTransaction({
      quotationId: quotation.id,
      currentVersion: quotation.currentVersion,
      eventRequestId: eventReq.id,
    });

    return { message: 'Quotation rejected.', status: 'REJECTED' };
  }

  requestChanges() {
    throw new BadRequestException(
      'Quotations are finalized by the Revenue Team upon generation. Reverse negotiations and request-changes workflows are disabled.',
    );
  }
}
