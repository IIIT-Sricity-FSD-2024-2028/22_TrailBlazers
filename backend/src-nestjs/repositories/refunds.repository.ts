import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import { NestLoggerService } from '../common/logging/logger.service';

export interface RefundRecord {
  id: string;
  refundNumber: string;
  customerType: 'ATTENDEE' | 'CLIENT';
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;

  eventId: string;
  eventRequestId?: string;
  eventName: string;
  organizationName?: string;
  eventDate?: string;

  ticketId?: string;
  ticketNumber?: string;
  ticketQuantity?: number;
  quotationId?: string;
  originalPaymentId?: string;
  originalPaymentTransactionId?: string;
  originalPaymentMethod?: string;
  originalPaymentAmount: number;

  totalPaidAmount: number;
  deductionAmount: number;
  deductionReason?: string;
  refundableAmount: number;
  actualRefundedAmount?: number;

  status: 'ELIGIBLE' | 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'REFUNDED' | 'FAILED';

  cancellationReason?: string;
  cancellationInitiatorId?: string;
  cancellationInitiatorName?: string;
  cancellationInitiatorRole?: string;
  cancellationTimestamp?: string;
  cancellationType?: 'ORGANIZER_CANCELLED' | 'CLIENT_CANCELLED' | 'FORCE_MAJEURE' | 'POSTPONED_REFUND_REQUEST';
  cancellationTerms?: string;

  reviewNotes?: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;

  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;

  rejectionReason?: string;
  rejectedByUserId?: string;
  rejectedByName?: string;
  rejectedAt?: string;

  processedByUserId?: string;
  processedByName?: string;
  processedAt?: string;

  refundTransactionId?: string;
  refundMethod?: string;
  refundedAt?: string;

  failureReason?: string;
  failedAt?: string;

  isPostponedEvent?: boolean;
  retainedTicket?: boolean;

  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class RefundsRepository {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  createRefund(record: RefundRecord): RefundRecord {
    return this.store.create<RefundRecord>('refunds', record);
  }

  updateRefund(id: string, patch: Partial<RefundRecord>): RefundRecord | null {
    return this.store.update<RefundRecord>('refunds', id, patch);
  }

  findRefundById(id: string): RefundRecord | null {
    if (!id) return null;
    return this.store.findById<RefundRecord>('refunds', id);
  }

  findRefundByTicketId(ticketId: string): RefundRecord | null {
    if (!ticketId) return null;
    return this.store.findOne<RefundRecord>(
      'refunds',
      (r) => r.ticketId === ticketId,
    );
  }

  findRefundByQuotationId(quotationId: string): RefundRecord | null {
    if (!quotationId) return null;
    return this.store.findOne<RefundRecord>(
      'refunds',
      (r) => r.quotationId === quotationId,
    );
  }

  findRefundsByEventId(eventId: string): RefundRecord[] {
    if (!eventId) return [];
    return this.store.find<RefundRecord>(
      'refunds',
      (r) => r.eventId === eventId || r.eventRequestId === eventId,
    );
  }

  findRefundsByCustomerId(customerId: string): RefundRecord[] {
    if (!customerId) return [];
    return this.store
      .find<RefundRecord>('refunds', (r) => r.customerId === customerId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  findAllRefunds(filters: {
    customerType?: string;
    status?: string;
    eventId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}): RefundRecord[] {
    let list = this.store.findAll<RefundRecord>('refunds');

    const { customerType, status, eventId, search, startDate, endDate } = filters;

    if (customerType && customerType !== 'ALL') {
      const typeUpper = customerType.toUpperCase();
      list = list.filter((r) => r.customerType === typeUpper);
    }

    if (status && status !== 'ALL') {
      const stUpper = status.toUpperCase();
      list = list.filter((r) => r.status === stUpper);
    }

    if (eventId && eventId !== 'ALL') {
      list = list.filter((r) => r.eventId === eventId || r.eventRequestId === eventId);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.refundNumber && r.refundNumber.toLowerCase().includes(q)) ||
          (r.id && r.id.toLowerCase().includes(q)) ||
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
          (r.eventName && r.eventName.toLowerCase().includes(q)) ||
          (r.refundTransactionId && r.refundTransactionId.toLowerCase().includes(q)) ||
          (r.originalPaymentTransactionId && r.originalPaymentTransactionId.toLowerCase().includes(q)),
      );
    }

    if (startDate) {
      list = list.filter((r) => (r.createdAt || '').substring(0, 10) >= startDate);
    }

    if (endDate) {
      list = list.filter((r) => (r.createdAt || '').substring(0, 10) <= endDate);
    }

    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  getRefundMetrics() {
    const all = this.store.findAll<RefundRecord>('refunds');

    const totalRefunds = all.length;
    const pendingRequests = all.filter((r) => r.status === 'REQUESTED').length;
    const underReview = all.filter((r) => r.status === 'UNDER_REVIEW').length;
    const awaitingApproval = all.filter((r) => r.status === 'UNDER_REVIEW' || r.status === 'REQUESTED').length;
    const approved = all.filter((r) => r.status === 'APPROVED').length;
    const processing = all.filter((r) => r.status === 'PROCESSING').length;
    const rejected = all.filter((r) => r.status === 'REJECTED').length;
    const completed = all.filter((r) => r.status === 'REFUNDED').length;
    const eligible = all.filter((r) => r.status === 'ELIGIBLE').length;

    const totalRefundedAmount = all
      .filter((r) => r.status === 'REFUNDED')
      .reduce((sum, r) => sum + (Number(r.actualRefundedAmount || r.refundableAmount) || 0), 0);

    const totalPendingAmount = all
      .filter((r) => ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING'].includes(r.status))
      .reduce((sum, r) => sum + (Number(r.refundableAmount) || 0), 0);

    const attendeeRefundsCount = all.filter((r) => r.customerType === 'ATTENDEE').length;
    const clientRefundsCount = all.filter((r) => r.customerType === 'CLIENT').length;

    return {
      totalRefunds,
      pendingRequests,
      underReview,
      awaitingApproval,
      approved,
      processing,
      rejected,
      completed,
      eligible,
      totalRefundedAmount,
      totalPendingAmount,
      attendeeRefundsCount,
      clientRefundsCount,
    };
  }

  createAuditLog(log: {
    id: string;
    refundId: string;
    actorUserId: string;
    actorName: string;
    actorRole: string;
    action: string;
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
    details?: any;
    createdAt: string;
  }) {
    return this.store.create('refund_audit_logs', log);
  }

  findAuditLogs(refundId: string): any[] {
    if (!refundId) return [];
    return this.store
      .find<any>('refund_audit_logs', (l) => l.refundId === refundId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
}

