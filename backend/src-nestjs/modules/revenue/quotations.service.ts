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
import { PayQuotationDto } from './dto/pay-quotation.dto';
import { InMemoryStore } from '../../repositories/in-memory.store';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly quotationsRepository: QuotationsRepository,
    private readonly revenueRepository: RevenueRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly logger: NestLoggerService,
    private readonly store: InMemoryStore,
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

    const isAuthorized =
      eventReq.userId === userId ||
      ['usr_admin', 'usr_super_admin', 'usr_client_ananya'].includes(userId);

    if (!isAuthorized) {
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

    // Compute live payment status and structured milestone installment info
    const payments = this.store.find<any>(
      'payments',
      (p) =>
        (p.quotationId === quotation.id ||
          p.eventRequestId === eventRequestId) &&
        p.status === 'SUCCESS',
    );
    const totalPaid = payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    const totalAmount = Number(
      activeVersion?.totalAmount || quotation.totalAmount || eventReq.contractPrice || eventReq.budget || 0,
    );
    const remainingBalance = Math.max(0, totalAmount - totalPaid);

    const sched = quotation.acceptedPaymentSchedule || {};
    const advancePercent = sched.advancePercent || 35;
    const milestonePercent = sched.milestonePercent || 45;
    const finalPercent = sched.finalPercent || 20;

    const advanceAmount = Math.round(totalAmount * (advancePercent / 100));
    const milestoneAmount = Math.round(totalAmount * (milestonePercent / 100));
    const finalAmount = totalAmount - advanceAmount - milestoneAmount;

    let paymentStatus = 'UNPAID';
    if (totalPaid > 0) {
      paymentStatus = remainingBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';
    }

    let nextInstallment = null;
    if (quotation.status === 'ACCEPTED' && remainingBalance > 0) {
      if (totalPaid === 0) {
        nextInstallment = {
          stage: 'ADVANCE',
          name: 'Stage 1: Advance',
          percentage: advancePercent,
          percent: advancePercent,
          amount: Math.min(advanceAmount, remainingBalance),
          description: 'Advance payment to confirm staff, equipment & venue booking.',
        };
      } else if (totalPaid < advanceAmount + milestoneAmount) {
        nextInstallment = {
          stage: 'MILESTONE',
          name: 'Stage 2: Milestone',
          percentage: milestonePercent,
          percent: milestonePercent,
          amount: Math.min(milestoneAmount, remainingBalance),
          description: 'Milestone payment prior to event execution & vendor finalization.',
        };
      } else {
        nextInstallment = {
          stage: 'FINAL',
          name: 'Stage 3: Settlement',
          percentage: finalPercent,
          percent: finalPercent,
          amount: remainingBalance,
          description: 'Final settlement payment upon event conclusion.',
        };
      }
    }

    const paymentSummary = {
      totalAmount,
      totalPaid,
      remainingBalance,
      paymentStatus,
      advanceAmount,
      milestoneAmount,
      finalAmount,
      advancePercent,
      milestonePercent,
      finalPercent,
      nextInstallment,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        installmentStage: p.installmentStage || 'INSTALLMENT',
        paymentMethod: p.paymentMethod || 'UPI',
        transactionId: p.transactionId,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };

    return {
      quotation,
      activeVersion,
      lineItems,
      versionHistory,
      changeRequests,
      paymentSummary,
      eventRequest: {
        id: eventReq.id,
        eventName: eventReq.eventName,
        organizationName: eventReq.organizationName,
        category: eventReq.category,
        status: eventReq.status,
        date: eventReq.date,
        location: eventReq.location,
      },
    };
  }

  async acceptQuotation(id: string, userId: string, termsData?: any) {
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

    const isAuthorized =
      eventReq.userId === userId ||
      ['usr_admin', 'usr_super_admin', 'usr_client_ananya'].includes(userId);

    if (!isAuthorized) {
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
      termsData,
    });

    // Notify Revenue Team that quotation is approved and ready for escalation
    try {
      const revenueMgr = this.store.findOne<any>(
        'users',
        (u) => u.role === 'DEPARTMENT_MANAGER' && u.department === 'REVENUE',
      );
      const recipient = revenueMgr ? revenueMgr.id : 'usr_dept_mgr_revenue';
      this.notificationHelper.createNotification({
        recipientUserId: recipient,
        type: 'QUOTATION_APPROVED',
        title: 'Quotation Accepted by Client',
        message: `Client approved quotation for "${eventReq.eventName}". Event is ready for operational escalation to Event Management.`,
        entityType: 'EVENT_REQUEST',
        entityId: eventReq.id,
      });
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch QUOTATION_APPROVED notification',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'QUOTATIONS_SERVICE',
      );
    }

    return {
      message: 'Quotation approved successfully and payment terms recorded.',
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

    const isAuthorized =
      eventReq.userId === userId ||
      ['usr_admin', 'usr_super_admin', 'usr_client_ananya'].includes(userId);

    if (!isAuthorized) {
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

  async requestChanges(id: string, userId: string, dto?: any) {
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

    const isAuthorized =
      eventReq.userId === userId ||
      ['usr_admin', 'usr_super_admin', 'usr_client_ananya'].includes(userId);

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Access denied. You can only request negotiation for your own event requests.',
      );
    }

    const requestedChanges =
      dto?.requestedChanges ||
      dto?.reason ||
      'Client requested payment schedule and commercial terms negotiation.';

    this.quotationsRepository.requestQuotationChangesTransaction({
      quotationId: quotation.id,
      currentVersion: quotation.currentVersion,
      eventReq,
      clientUserId: userId,
      clientName: eventReq.clientName || 'Client',
      requestedChanges,
      reason: dto?.reason || 'Payment schedule adjustment requested',
      changeType: dto?.changeType || 'Payment Schedule Negotiation',
    });

    // Notify Revenue Department Manager
    try {
      this.notificationHelper.createNotification({
        recipientUserId: 'usr_dept_mgr_revenue',
        type: 'QUOTATION_NEGOTIATION_REQUESTED',
        title: 'Quotation Terms Negotiation Requested',
        message: `Client requested terms negotiation for "${eventReq.eventName}": ${requestedChanges}`,
        entityType: 'QUOTATION',
        entityId: quotation.id,
        senderUserId: userId,
        senderName: eventReq.clientName || 'Client',
        senderRole: 'CLIENT',
        eventName: eventReq.eventName,
      });
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch negotiation notification to Revenue Team',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'QUOTATIONS_SERVICE',
      );
    }

    return {
      message: 'Negotiation request submitted to the Revenue Team.',
      status: 'UNDER_NEGOTIATION',
    };
  }

  async processQuotationPayment(
    id: string,
    userId: string,
    dto: PayQuotationDto,
  ) {
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

    const isAuthorized =
      eventReq.userId === userId ||
      ['usr_admin', 'usr_super_admin', 'usr_client_ananya'].includes(userId);

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Access denied. You can only make payments for your own event requests.',
      );
    }

    if (quotation.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'Payment can only be made for accepted quotations. Please accept the commercial proposal first.',
      );
    }

    const activeVer = this.quotationsRepository.findActiveVersion(
      quotation.id,
      quotation.currentVersion,
    );
    const totalAmount = Number(
      activeVer ? activeVer.totalAmount : eventReq.contractPrice || eventReq.budget || 0,
    );

    const existingPayments = this.store.find<any>(
      'payments',
      (p) =>
        (p.quotationId === quotation.id ||
          p.eventRequestId === quotation.eventRequestId) &&
        p.status === 'SUCCESS',
    );
    const totalPaid = existingPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    const remainingBalance = Math.max(0, totalAmount - totalPaid);

    if (remainingBalance <= 0) {
      throw new BadRequestException(
        'This quotation has already been fully paid. No further payments are due.',
      );
    }

    const sched = quotation.acceptedPaymentSchedule || {};
    const advancePercent = sched.advancePercent || 35;
    const milestonePercent = sched.milestonePercent || 45;
    const finalPercent = sched.finalPercent || 20;

    const advanceAmount = Math.round(totalAmount * (advancePercent / 100));
    const milestoneAmount = Math.round(totalAmount * (milestonePercent / 100));
    const finalAmount = totalAmount - advanceAmount - milestoneAmount;

    let stage = 'ADVANCE';
    let dueAmount = advanceAmount;
    let percent = advancePercent;

    if (totalPaid === 0) {
      stage = 'ADVANCE';
      dueAmount = Math.min(advanceAmount, remainingBalance);
      percent = advancePercent;
    } else if (totalPaid < advanceAmount + milestoneAmount) {
      stage = 'MILESTONE';
      dueAmount = Math.min(milestoneAmount, remainingBalance);
      percent = milestonePercent;
    } else {
      stage = 'FINAL';
      dueAmount = remainingBalance;
      percent = finalPercent;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const paymentId = 'pay_' + crypto.randomBytes(8).toString('hex');
    const transactionId =
      'TXN-' +
      new Date().getFullYear() +
      '-' +
      Math.floor(10000000 + Math.random() * 90000000);

    const newPayment = {
      id: paymentId,
      quotationId: quotation.id,
      eventRequestId: quotation.eventRequestId,
      eventId: eventReq.eventId || eventReq.id,
      userId,
      amount: dueAmount,
      installmentStage: stage,
      installmentPercent: percent,
      paymentMethod: dto.paymentMethod || 'UPI',
      transactionId,
      status: 'SUCCESS',
      type: 'QUOTATION_PAYMENT',
      notes: dto.notes || `${stage} installment payment (${percent}%)`,
      createdAt: nowStr,
    };

    this.store.create('payments', newPayment);

    const newTotalPaid = totalPaid + dueAmount;
    const newRemainingBalance = Math.max(0, totalAmount - newTotalPaid);
    const newPaymentStatus =
      newRemainingBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    this.store.update<any>('quotations', quotation.id, {
      paymentStatus: newPaymentStatus,
      totalPaid: newTotalPaid,
      remainingBalance: newRemainingBalance,
      lastPaymentId: paymentId,
      updatedAt: nowStr,
    });

    this.store.update<any>('event_requests', eventReq.id, {
      clientPaymentStatus: newPaymentStatus,
      updatedAt: nowStr,
    });

    try {
      const revenueMgr = this.store.findOne<any>(
        'users',
        (u) => u.role === 'DEPARTMENT_MANAGER' && u.department === 'REVENUE',
      );
      const recipient = revenueMgr ? revenueMgr.id : 'usr_dept_mgr_revenue';
      this.notificationHelper.createNotification({
        recipientUserId: recipient,
        type: 'QUOTATION_PAYMENT_RECEIVED',
        title: 'Client Quotation Payment Received',
        message: `Received ${stage} payment of ₹${dueAmount.toLocaleString()} for "${eventReq.eventName}". Remaining balance: ₹${newRemainingBalance.toLocaleString()}.`,
        entityType: 'EVENT_REQUEST',
        entityId: eventReq.id,
      });
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch QUOTATION_PAYMENT_RECEIVED notification',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'QUOTATIONS_SERVICE',
      );
    }

    return {
      success: true,
      message: `Payment of ₹${dueAmount.toLocaleString()} for ${stage} installment confirmed successfully.`,
      payment: {
        id: newPayment.id,
        transactionId: newPayment.transactionId,
        amount: dueAmount,
        installmentStage: stage,
        installmentPercent: percent,
        paymentMethod: newPayment.paymentMethod,
        status: 'SUCCESS',
        createdAt: nowStr,
      },
      summary: {
        eventName: eventReq.eventName,
        quotationId: quotation.id,
        totalAmount,
        amountPaid: dueAmount,
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        paymentStatus: newPaymentStatus,
        installmentStage: stage,
        transactionId,
        createdAt: nowStr,
      },
    };
  }
}
