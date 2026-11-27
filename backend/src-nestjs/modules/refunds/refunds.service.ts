import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InMemoryStore } from '../../repositories/in-memory.store';
import { RefundsRepository, RefundRecord } from '../../repositories/refunds.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { NestLoggerService } from '../../common/logging/logger.service';
import { CancelEventDto } from './dto/cancel-event.dto';
import { PostponeEventDto } from './dto/postpone-event.dto';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { RecordDeductionDto } from './dto/record-deduction.dto';
import { ApproveRefundDto } from './dto/approve-refund.dto';
import { RejectRefundDto } from './dto/reject-refund.dto';
import { CompleteRefundDto } from './dto/complete-refund.dto';
import { RefundQueryDto } from './dto/refund-query.dto';
import { parseEventDateTime, computeClientCancellationTier } from '../../utils/date-time.util';

@Injectable()
export class RefundsService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly refundsRepository: RefundsRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly logger: NestLoggerService,
  ) {}

  private isRevenueTeam(user: any): boolean {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    const dept = (user.department || '').toUpperCase();
    return role === 'REVENUE' || (role === 'DEPARTMENT_MANAGER' && dept === 'REVENUE') || role === 'SUPER_ADMIN';
  }

  private isRevenueProcessor(user: any): boolean {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    const dept = (user.department || '').toUpperCase();
    // Exclusive authority: Revenue team members and Revenue Dept Head
    return role === 'REVENUE' || (role === 'DEPARTMENT_MANAGER' && dept === 'REVENUE');
  }

  private enforceRevenueProcessor(user: any) {
    if (!this.isRevenueProcessor(user)) {
      throw new ForbiddenException(
        'Access denied. Only authorized members of the REVENUE department can review, calculate deductions, approve, or process refunds.',
      );
    }
  }

  // 1. Dashboard Metrics
  async getMetrics(user: any) {
    if (!this.isRevenueTeam(user)) {
      throw new ForbiddenException(
        'Access denied. Only Revenue Team, Revenue Department Head, and Super Admin can view refund metrics.',
      );
    }
    return this.refundsRepository.getRefundMetrics();
  }

  // 2. Filtered Refund List (Revenue / Admin)
  async getRefunds(query: RefundQueryDto, user: any) {
    if (!this.isRevenueTeam(user)) {
      throw new ForbiddenException(
        'Access denied. Only Revenue Department and Super Admin are permitted to view all refund records.',
      );
    }
    const refunds = this.refundsRepository.findAllRefunds(query);
    return {
      total: refunds.length,
      refunds,
    };
  }

  // 3. Customer Own Refunds (Attendee / Client)
  async getMyRefunds(user: any) {
    const refunds = this.refundsRepository.findRefundsByCustomerId(user.id);
    return {
      total: refunds.length,
      refunds,
    };
  }

  // 4. Single Refund Details (With full payment, contract & audit breakdown)
  async getRefundDetails(id: string, user: any) {
    const refund = this.refundsRepository.findRefundById(id);
    if (!refund) {
      throw new NotFoundException(`Refund record '${id}' not found.`);
    }

    // Role check: Revenue team, Super Admin, or owning customer
    const isOwner = refund.customerId === user.id;
    if (!isOwner && !this.isRevenueTeam(user)) {
      throw new ForbiddenException(
        'Access denied. You do not have permission to view this refund record.',
      );
    }

    // Associated original payments
    let payments: any[] = [];
    if (refund.ticketId) {
      payments = this.store.find<any>(
        'payments',
        (p) => p.ticketId === refund.ticketId,
      );
    } else if (refund.quotationId) {
      payments = this.store.find<any>(
        'payments',
        (p) => p.quotationId === refund.quotationId,
      );
    }

    // Associated quotation details if B2B Client
    let quotationDetails: any = null;
    if (refund.quotationId) {
      const q = this.store.findById<any>('quotations', refund.quotationId);
      if (q) {
        const activeVer = this.store.findOne<any>(
          'quotation_versions',
          (v) => v.quotationId === q.id && Number(v.versionNumber) === Number(q.currentVersion),
        );
        const lineItems = activeVer
          ? this.store.find<any>('quotation_line_items', (l) => l.versionId === activeVer.id)
          : [];
        quotationDetails = {
          quotation: q,
          version: activeVer,
          lineItems,
          acceptedPaymentSchedule: q.acceptedPaymentSchedule || {
            advancePercent: 35,
            milestonePercent: 45,
            finalPercent: 20,
          },
        };
      }
    }

    // Associated ticket details if B2C Attendee
    let ticketDetails: any = null;
    if (refund.ticketId) {
      ticketDetails = this.store.findById<any>('tickets', refund.ticketId);
    }

    const auditLogs = this.refundsRepository.findAuditLogs(id);

    return {
      refund,
      payments,
      quotationDetails,
      ticketDetails,
      auditLogs,
    };
  }

  // 5. Submit or Claim Refund Request (Attendee / Client)
  async requestRefund(dto: CreateRefundRequestDto, user: any) {
    const { ticketId, quotationId, eventId, reason } = dto;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (ticketId) {
      const ticket = this.store.findById<any>('tickets', ticketId);
      if (!ticket) {
        throw new NotFoundException('Ticket not found.');
      }
      if (ticket.userId !== user.id && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('You can only request refunds for your own tickets.');
      }

      // Check if ticket is already cancelled
      if (
        ticket.registrationStatus === 'CANCELLED' ||
        ticket.ticketStatus === 'CANCELLED' ||
        ticket.registrationStatus === 'REFUNDED'
      ) {
        throw new ConflictException('This ticket has already been cancelled.');
      }

      // Rule 1: Attendees cannot cancel tickets after check-in / entry
      const isCheckedIn =
        ticket.checkedIn === 1 ||
        ticket.checkedIn === true ||
        Boolean(ticket.checkedInAt) ||
        ['FULLY_CHECKED_IN', 'PARTIALLY_CHECKED_IN', 'ENTERED'].includes(ticket.entryStatus);

      const hasEnteredMembers = this.store
        .find<any>('ticket_members', (m) => m.ticketId === ticket.id)
        .some((m) => m.firstEnteredAt || (m.entryStatus && m.entryStatus !== 'NOT_ENTERED' && m.entryStatus !== 'CANCELLED'));

      const hasEntryLogs = this.store
        .find<any>('ticket_entry_logs', (l) => l.ticketId === ticket.id && l.action === 'ENTRY')
        .length > 0;

      if (isCheckedIn || hasEnteredMembers || hasEntryLogs) {
        throw new ConflictException('This ticket cannot be cancelled because it has already been used for event entry.');
      }

      // Check event and cancellation window
      const event = this.store.findById<any>('events', ticket.eventId) ||
                    this.store.findById<any>('event_requests', ticket.eventId);

      const eventStartDateStr = event?.startDate || event?.date || event?.eventDate || '';
      const eventStartTimeStr = event?.startTime || '09:00 AM';
      const eventStartDateTime = parseEventDateTime(eventStartDateStr, eventStartTimeStr) || new Date(eventStartDateStr);
      if (eventStartDateTime && eventStartDateTime.getTime() <= Date.now()) {
        throw new BadRequestException(
          'Cancellation window closed. Tickets cannot be cancelled after the event has started or concluded.',
        );
      }

      // Check anti-abuse cancellation limit: maximum 2 cancellations per attendee per event
      const previousCancellations = this.store.count(
        'ticket_cancellations',
        (tc) => tc.userId === user.id && tc.eventId === ticket.eventId,
      );
      if (previousCancellations >= 2) {
        throw new BadRequestException(
          'Cancellation limit reached. A maximum of 2 cancellations is permitted per attendee for this event. Further cancellations for this event are not allowed.',
        );
      }

      // Helper function to release inventory and invalidate ticket + members
      const releaseInventoryAndInvalidate = () => {
        const ticketQuantity = Number(ticket.quantity) || 1;
        const eventInEvents = this.store.findById<any>('events', ticket.eventId);
        if (eventInEvents) {
          const curAvail = Number(eventInEvents.availableTickets) || 0;
          this.store.update<any>('events', ticket.eventId, {
            availableTickets: curAvail + ticketQuantity,
            updatedAt: nowStr,
          });
        }
        const eventInRequests = this.store.findById<any>('event_requests', ticket.eventId);
        if (eventInRequests) {
          const curAvail = Number(eventInRequests.expectedAttendance) || 0;
          this.store.update<any>('event_requests', ticket.eventId, {
            expectedAttendance: curAvail + ticketQuantity,
            updatedAt: nowStr,
          });
        }

        // Record in ticket_cancellations history
        const cancellationRecordId = 'tc_' + crypto.randomBytes(8).toString('hex');
        this.store.create('ticket_cancellations', {
          id: cancellationRecordId,
          userId: user.id,
          eventId: ticket.eventId,
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          quantity: ticketQuantity,
          reason: reason || 'Attendee requested ticket cancellation',
          cancelledAt: nowStr,
          status: 'CANCELLED',
        });

        // Invalidate ticket status
        this.store.update<any>('tickets', ticket.id, {
          registrationStatus: 'CANCELLED',
          ticketStatus: 'CANCELLED',
          cancellationReason: reason || 'Attendee requested cancellation',
          updatedAt: nowStr,
        });

        // Invalidate individual ticket members
        const members = this.store.find<any>('ticket_members', (m) => m.ticketId === ticket.id);
        for (const m of members) {
          this.store.update<any>('ticket_members', m.id, {
            entryStatus: 'CANCELLED',
            updatedAt: nowStr,
          });
        }
      };

      // Check existing refund record
      let existingRefund = this.refundsRepository.findRefundByTicketId(ticketId);
      if (existingRefund) {
        if (existingRefund.status === 'ELIGIBLE') {
          // Transition from ELIGIBLE to REQUESTED
          const updated = this.refundsRepository.updateRefund(existingRefund.id, {
            status: 'REQUESTED',
            cancellationReason: reason || existingRefund.cancellationReason || 'Attendee requested refund',
            updatedAt: nowStr,
          })!;

          releaseInventoryAndInvalidate();

          this.refundsRepository.createAuditLog({
            id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
            refundId: existingRefund.id,
            actorUserId: user.id,
            actorName: user.name || 'Attendee',
            actorRole: user.role || 'ATTENDEE',
            action: 'REQUESTED',
            previousStatus: 'ELIGIBLE',
            newStatus: 'REQUESTED',
            notes: reason || 'Attendee requested refund for eligible ticket.',
            createdAt: nowStr,
          });

          return { message: 'Refund request submitted successfully.', refund: updated };
        } else if (['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'REFUNDED'].includes(existingRefund.status)) {
          throw new BadRequestException(
            `A refund request for this ticket is already in status '${existingRefund.status}'.`,
          );
        }
      }

      const totalPaid = Number(ticket.totalAmount || (Number(ticket.unitPrice || 0) * (ticket.quantity || 1) + Number(ticket.platformFee || 0)));
      const refundId = 'ref_' + crypto.randomBytes(8).toString('hex');
      const refundNumber = 'REF-2026-' + Math.floor(10000 + Math.random() * 90000);

      const newRefund: RefundRecord = {
        id: refundId,
        refundNumber,
        customerType: 'ATTENDEE',
        customerId: user.id,
        customerName: user.name || 'Attendee',
        customerEmail: user.email || '',
        eventId: ticket.eventId,
        eventName: event?.name || event?.eventName || 'Event Ticket',
        organizationName: event?.organizationName || 'Wavevents',
        eventDate: event?.date || event?.eventDate || '',
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        ticketQuantity: Number(ticket.quantity) || 1,
        originalPaymentAmount: totalPaid,
        totalPaidAmount: totalPaid,
        deductionAmount: 0,
        refundableAmount: totalPaid,
        status: 'REQUESTED',
        cancellationReason: reason || 'Attendee requested refund',
        cancellationType: event?.isPostponed ? 'POSTPONED_REFUND_REQUEST' : 'ORGANIZER_CANCELLED',
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      const created = this.refundsRepository.createRefund(newRefund);

      releaseInventoryAndInvalidate();

      this.refundsRepository.createAuditLog({
        id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
        refundId,
        actorUserId: user.id,
        actorName: user.name || 'Attendee',
        actorRole: user.role || 'ATTENDEE',
        action: 'REQUESTED',
        newStatus: 'REQUESTED',
        notes: reason || 'Attendee requested ticket refund.',
        createdAt: nowStr,
      });

      return { message: 'Refund request registered successfully.', refund: created };
    }

    if (quotationId || eventId) {
      const q = quotationId
        ? this.store.findById<any>('quotations', quotationId)
        : this.store.findOne<any>('quotations', (item) => item.eventRequestId === eventId);

      if (!q) {
        throw new NotFoundException('Quotation not found.');
      }

      const eventReq = this.store.findById<any>('event_requests', q.eventRequestId);
      if (eventReq && eventReq.userId !== user.id && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('You can only request refunds for your own event quotations.');
      }

      const eventObj = this.store.findById<any>('events', q.eventRequestId);

      // Check if event is already cancelled
      const isAlreadyCancelled =
        eventReq?.status === 'CANCELLED' ||
        eventReq?.operationalStatus === 'CANCELLED' ||
        eventObj?.status === 'CANCELLED' ||
        eventObj?.operationalStatus === 'CANCELLED';
      if (isAlreadyCancelled) {
        throw new ConflictException('This event has already been cancelled.');
      }

      // Check if event has started, is ongoing, or is completed
      const isStartedOrCompleted =
        ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(eventReq?.status) ||
        ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(eventReq?.operationalStatus) ||
        ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(eventObj?.status) ||
        ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(eventObj?.operationalStatus);

      const eventStartDateStr = eventObj?.startDate || eventObj?.date || eventReq?.startDate || eventReq?.eventDate || '';
      const eventStartTimeStr = eventObj?.startTime || eventReq?.startTime || '09:00 AM';
      const eventDateTime = parseEventDateTime(eventStartDateStr, eventStartTimeStr) || new Date(eventStartDateStr);
      const hasStartedByTime = eventDateTime && eventDateTime.getTime() <= Date.now();

      if (isStartedOrCompleted || hasStartedByTime) {
        throw new ConflictException('This event cannot be cancelled because it has already started or has been completed.');
      }

      let existingRefund = this.refundsRepository.findRefundByQuotationId(q.id);
      if (existingRefund) {
        if (existingRefund.status === 'ELIGIBLE') {
          const updated = this.refundsRepository.updateRefund(existingRefund.id, {
            status: 'REQUESTED',
            cancellationReason: reason || existingRefund.cancellationReason || 'Client requested refund',
            updatedAt: nowStr,
          })!;

          this.refundsRepository.createAuditLog({
            id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
            refundId: existingRefund.id,
            actorUserId: user.id,
            actorName: user.name || 'Client',
            actorRole: user.role || 'CLIENT',
            action: 'REQUESTED',
            previousStatus: 'ELIGIBLE',
            newStatus: 'REQUESTED',
            notes: reason || 'Client requested refund for contract.',
            createdAt: nowStr,
          });

          return { message: 'Client refund request submitted successfully.', refund: updated };
        } else {
          throw new BadRequestException(
            `A refund request for this quotation is already in status '${existingRefund.status}'.`,
          );
        }
      }

      // Calculate paid amount
      const payments = this.store.find<any>(
        'payments',
        (p) => (p.quotationId === q.id || (!p.quotationId && p.eventRequestId === q.eventRequestId)) && p.status === 'SUCCESS',
      );
      const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      if (totalPaid <= 0) {
        throw new BadRequestException('No recorded successful payments found for this quotation to refund.');
      }

      const refundId = 'ref_' + crypto.randomBytes(8).toString('hex');
      const refundNumber = 'REF-2026-' + Math.floor(10000 + Math.random() * 90000);

      const newRefund: RefundRecord = {
        id: refundId,
        refundNumber,
        customerType: 'CLIENT',
        customerId: user.id,
        customerName: eventReq?.organizationName || user.name || 'Corporate Client',
        customerEmail: eventReq?.contactEmail || user.email || '',
        eventId: q.eventRequestId,
        eventRequestId: q.eventRequestId,
        eventName: eventReq?.eventName || 'Corporate Event Contract',
        organizationName: eventReq?.organizationName || '',
        eventDate: eventReq?.eventDate || eventReq?.startDate || '',
        quotationId: q.id,
        originalPaymentAmount: totalPaid,
        totalPaidAmount: totalPaid,
        deductionAmount: 0,
        refundableAmount: totalPaid,
        status: 'REQUESTED',
        cancellationReason: reason || 'Client cancellation request',
        cancellationType: 'CLIENT_CANCELLED',
        cancellationTerms: 'Governed by agreed 3-stage payment plan (35% Advance, 45% Milestone, 20% Final) and contractual deduction clauses.',
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      const created = this.refundsRepository.createRefund(newRefund);

      this.refundsRepository.createAuditLog({
        id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
        refundId,
        actorUserId: user.id,
        actorName: user.name || 'Client',
        actorRole: user.role || 'CLIENT',
        action: 'REQUESTED',
        newStatus: 'REQUESTED',
        notes: reason || 'Client requested contract refund.',
        createdAt: nowStr,
      });

      return { message: 'Client refund request submitted successfully.', refund: created };
    }

    throw new BadRequestException('Either ticketId, quotationId, or eventId is required to request a refund.');
  }

  // 6. Review Refund (Revenue Team marks as UNDER_REVIEW)
  async reviewRefund(id: string, notes: string | undefined, user: any) {
    this.enforceRevenueProcessor(user);
    const refund = this.refundsRepository.findRefundById(id);
    if (!refund) {
      throw new NotFoundException(`Refund '${id}' not found.`);
    }

    if (refund.status === 'REFUNDED') {
      throw new BadRequestException('Refund has already been completed.');
    }
    if (refund.status === 'REJECTED') {
      throw new BadRequestException('Refund has already been rejected.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = this.refundsRepository.updateRefund(id, {
      status: 'UNDER_REVIEW',
      reviewNotes: notes || refund.reviewNotes || 'Under formal review by Revenue Department.',
      reviewedByUserId: user.id,
      reviewedByName: user.name || 'Revenue Specialist',
      reviewedAt: nowStr,
      updatedAt: nowStr,
    })!;

    this.refundsRepository.createAuditLog({
      id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
      refundId: id,
      actorUserId: user.id,
      actorName: user.name || 'Revenue Specialist',
      actorRole: user.role || 'REVENUE',
      action: 'UNDER_REVIEW',
      previousStatus: refund.status,
      newStatus: 'UNDER_REVIEW',
      notes: notes || 'Refund placed under review by Revenue Team.',
      createdAt: nowStr,
    });

    return { message: 'Refund status set to UNDER_REVIEW.', refund: updated };
  }

  // 7. Record Deductions (Verified expenses / contractual deductions)
  async recordDeductions(id: string, dto: RecordDeductionDto, user: any) {
    this.enforceRevenueProcessor(user);
    const refund = this.refundsRepository.findRefundById(id);
    if (!refund) {
      throw new NotFoundException(`Refund '${id}' not found.`);
    }

    if (['REFUNDED', 'REJECTED'].includes(refund.status)) {
      throw new BadRequestException(`Cannot adjust deductions on a '${refund.status}' refund.`);
    }

    const deductionAmount = Math.max(0, Number(dto.deductionAmount || 0));
    if (deductionAmount > refund.totalPaidAmount) {
      throw new BadRequestException(
        `Deduction amount (₹${deductionAmount.toLocaleString()}) cannot exceed the total paid amount (₹${refund.totalPaidAmount.toLocaleString()}).`,
      );
    }

    if (!dto.deductionReason || !dto.deductionReason.trim()) {
      throw new BadRequestException('A documented explanation for the deduction is mandatory.');
    }

    const refundableAmount = Math.max(0, refund.totalPaidAmount - deductionAmount);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updated = this.refundsRepository.updateRefund(id, {
      deductionAmount,
      deductionReason: dto.deductionReason.trim(),
      refundableAmount,
      updatedAt: nowStr,
    })!;

    this.refundsRepository.createAuditLog({
      id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
      refundId: id,
      actorUserId: user.id,
      actorName: user.name || 'Revenue Specialist',
      actorRole: user.role || 'REVENUE',
      action: 'DEDUCTION_UPDATED',
      notes: `Deduction recorded: ₹${deductionAmount.toLocaleString()} (${dto.deductionReason}). Calculated refundable balance: ₹${refundableAmount.toLocaleString()}.`,
      details: { deductionAmount, deductionReason: dto.deductionReason, refundableAmount },
      createdAt: nowStr,
    });

    return {
      message: 'Deductions and refundable amount recalculated successfully.',
      refund: updated,
    };
  }

  // 8. Approve Refund (Revenue Team ONLY)
  async approveRefund(id: string, dto: ApproveRefundDto, user: any) {
    this.enforceRevenueProcessor(user);
    const refund = this.refundsRepository.findRefundById(id);
    if (!refund) {
      throw new NotFoundException(`Refund '${id}' not found.`);
    }

    if (refund.status === 'APPROVED') {
      return { message: 'Refund is already approved.', refund };
    }
    if (refund.status === 'REFUNDED') {
      throw new BadRequestException('Refund is already completed.');
    }
    if (refund.status === 'REJECTED') {
      throw new BadRequestException('Refund was previously rejected. Please review before approving.');
    }

    let deductionAmount = refund.deductionAmount;
    let deductionReason = refund.deductionReason;

    if (dto.deductionAmount !== undefined) {
      deductionAmount = Math.max(0, Number(dto.deductionAmount));
      if (deductionAmount > refund.totalPaidAmount) {
        throw new BadRequestException(
          `Deduction (₹${deductionAmount.toLocaleString()}) cannot exceed total paid amount (₹${refund.totalPaidAmount.toLocaleString()}).`,
        );
      }
      if (deductionAmount > 0 && !dto.deductionReason && !refund.deductionReason) {
        throw new BadRequestException('Documented reason is required when deductions are applied.');
      }
      if (dto.deductionReason) {
        deductionReason = dto.deductionReason.trim();
      }
    }

    const refundableAmount = Math.max(0, refund.totalPaidAmount - deductionAmount);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updated = this.refundsRepository.updateRefund(id, {
      status: 'APPROVED',
      deductionAmount,
      deductionReason,
      refundableAmount,
      approvedByUserId: user.id,
      approvedByName: user.name || 'Revenue Specialist',
      approvedAt: nowStr,
      reviewNotes: dto.notes || refund.reviewNotes,
      updatedAt: nowStr,
    })!;

    this.refundsRepository.createAuditLog({
      id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
      refundId: id,
      actorUserId: user.id,
      actorName: user.name || 'Revenue Specialist',
      actorRole: user.role || 'REVENUE',
      action: 'APPROVED',
      previousStatus: refund.status,
      newStatus: 'APPROVED',
      notes: `Refund approved by Revenue Team for ₹${refundableAmount.toLocaleString()}${deductionAmount > 0 ? ` (after ₹${deductionAmount.toLocaleString()} deduction)` : ''}. Awaiting financial processing.`,
      details: { deductionAmount, refundableAmount, notes: dto.notes },
      createdAt: nowStr,
    });

    // Notify Customer
    try {
      this.notificationHelper.createNotification({
        recipientUserId: refund.customerId,
        type: 'REFUND_APPROVED',
        title: 'Refund Request Approved',
        message: `Your refund of ₹${refundableAmount.toLocaleString()} for "${refund.eventName}" has been approved by the Revenue Team and queued for settlement.`,
        entityType: 'REFUND',
        entityId: refund.id,
        senderUserId: user.id,
        senderName: user.name || 'Revenue Team',
        senderRole: 'REVENUE',
        eventName: refund.eventName,
      });
    } catch (e) {
      this.logger.warn(`Failed to dispatch REFUND_APPROVED notification: ${e}`);
    }

    return {
      message: 'Refund approved successfully. Ready for processing.',
      refund: updated,
    };
  }

  // 9. Reject Refund (Revenue Team ONLY)
  async rejectRefund(id: string, dto: RejectRefundDto, user: any) {
    this.enforceRevenueProcessor(user);
    const refund = this.refundsRepository.findRefundById(id);
    if (!refund) {
      throw new NotFoundException(`Refund '${id}' not found.`);
    }

    if (refund.status === 'REFUNDED') {
      throw new BadRequestException('Cannot reject a refund that has already been paid and settled.');
    }

    if (!dto.rejectionReason || !dto.rejectionReason.trim()) {
      throw new BadRequestException('A clear rejection reason is mandatory.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = this.refundsRepository.updateRefund(id, {
      status: 'REJECTED',
      rejectionReason: dto.rejectionReason.trim(),
      rejectedByUserId: user.id,
      rejectedByName: user.name || 'Revenue Specialist',
      rejectedAt: nowStr,
      updatedAt: nowStr,
    })!;

    this.refundsRepository.createAuditLog({
      id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
      refundId: id,
      actorUserId: user.id,
      actorName: user.name || 'Revenue Specialist',
      actorRole: user.role || 'REVENUE',
      action: 'REJECTED',
      previousStatus: refund.status,
      newStatus: 'REJECTED',
      notes: `Refund rejected. Reason: ${dto.rejectionReason.trim()}`,
      createdAt: nowStr,
    });

    // Notify Customer
    try {
      this.notificationHelper.createNotification({
        recipientUserId: refund.customerId,
        type: 'REFUND_REJECTED',
        title: 'Refund Request Rejected',
        message: `Your refund request for "${refund.eventName}" was rejected by the Revenue Department. Reason: ${dto.rejectionReason.trim()}`,
        entityType: 'REFUND',
        entityId: refund.id,
        senderUserId: user.id,
        senderName: user.name || 'Revenue Team',
        senderRole: 'REVENUE',
        eventName: refund.eventName,
      });
    } catch (e) {
      this.logger.warn(`Failed to dispatch REFUND_REJECTED notification: ${e}`);
    }

    return {
      message: 'Refund request rejected.',
      refund: updated,
    };
  }

  // 10. Mark as PROCESSING (Revenue Team ONLY)
  async processRefund(id: string, notes: string | undefined, user: any) {
    this.enforceRevenueProcessor(user);
    const refund = this.refundsRepository.findRefundById(id);
    if (!refund) {
      throw new NotFoundException(`Refund '${id}' not found.`);
    }

    if (refund.status !== 'APPROVED') {
      throw new BadRequestException(
        `Refund can only transition to PROCESSING from APPROVED status. Current status is '${refund.status}'.`,
      );
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = this.refundsRepository.updateRefund(id, {
      status: 'PROCESSING',
      processedByUserId: user.id,
      processedByName: user.name || 'Revenue Specialist',
      processedAt: nowStr,
      updatedAt: nowStr,
    })!;

    this.refundsRepository.createAuditLog({
      id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
      refundId: id,
      actorUserId: user.id,
      actorName: user.name || 'Revenue Specialist',
      actorRole: user.role || 'REVENUE',
      action: 'PROCESSING',
      previousStatus: 'APPROVED',
      newStatus: 'PROCESSING',
      notes: notes || 'Refund payout initiated; awaiting banking settlement confirmation.',
      createdAt: nowStr,
    });

    return {
      message: 'Refund marked as PROCESSING.',
      refund: updated,
    };
  }

  // 11. Complete Refund (Revenue Team marks as REFUNDED with Transaction Reference)
  async completeRefund(id: string, dto: CompleteRefundDto, user: any) {
    this.enforceRevenueProcessor(user);
    const refund = this.refundsRepository.findRefundById(id);
    if (!refund) {
      throw new NotFoundException(`Refund '${id}' not found.`);
    }

    if (!['APPROVED', 'PROCESSING'].includes(refund.status)) {
      throw new BadRequestException(
        `Refund must be APPROVED or PROCESSING before completion. Current status is '${refund.status}'.`,
      );
    }

    if (!dto.refundTransactionId || !dto.refundTransactionId.trim()) {
      throw new BadRequestException('A valid transaction reference / settlement ID is required to complete a refund.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const actualRefundedAmount = dto.actualRefundedAmount !== undefined ? dto.actualRefundedAmount : refund.refundableAmount;

    if (actualRefundedAmount > refund.totalPaidAmount) {
      throw new BadRequestException('Disbursed refund cannot exceed total paid amount.');
    }

    const updated = this.refundsRepository.updateRefund(id, {
      status: 'REFUNDED',
      refundTransactionId: dto.refundTransactionId.trim(),
      refundMethod: dto.refundMethod || refund.originalPaymentMethod || 'UPI',
      actualRefundedAmount,
      refundedAt: nowStr,
      updatedAt: nowStr,
    })!;

    // Synchronize ticket record if Attendee refund
    if (refund.ticketId) {
      this.store.update<any>('tickets', refund.ticketId, {
        registrationStatus: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        updatedAt: nowStr,
      });

      // Synchronize payment records
      const payments = this.store.find<any>('payments', (p) => p.ticketId === refund.ticketId);
      for (const p of payments) {
        this.store.update<any>('payments', p.id, {
          status: 'REFUNDED',
          refundTransactionId: dto.refundTransactionId.trim(),
          updatedAt: nowStr,
        });
      }
    }

    // Synchronize quotation record if Client refund
    if (refund.quotationId) {
      this.store.update<any>('quotations', refund.quotationId, {
        paymentStatus: 'REFUNDED',
        updatedAt: nowStr,
      });
      const payments = this.store.find<any>('payments', (p) => p.quotationId === refund.quotationId);
      for (const p of payments) {
        this.store.update<any>('payments', p.id, {
          status: 'REFUNDED',
          refundTransactionId: dto.refundTransactionId.trim(),
          updatedAt: nowStr,
        });
      }
    }

    this.refundsRepository.createAuditLog({
      id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
      refundId: id,
      actorUserId: user.id,
      actorName: user.name || 'Revenue Specialist',
      actorRole: user.role || 'REVENUE',
      action: 'REFUNDED',
      previousStatus: refund.status,
      newStatus: 'REFUNDED',
      notes: `Refund completed and verified. Reference: ${dto.refundTransactionId.trim()}. Disbursed: ₹${actualRefundedAmount.toLocaleString()} via ${dto.refundMethod || 'Original Method'}.`,
      details: {
        refundTransactionId: dto.refundTransactionId.trim(),
        actualRefundedAmount,
        refundMethod: dto.refundMethod,
      },
      createdAt: nowStr,
    });

    // Notify Customer
    try {
      this.notificationHelper.createNotification({
        recipientUserId: refund.customerId,
        type: 'REFUND_COMPLETED',
        title: 'Refund Successfully Disbursed',
        message: `Your refund of ₹${actualRefundedAmount.toLocaleString()} for "${refund.eventName}" has been disbursed. Settlement Reference: ${dto.refundTransactionId.trim()}.`,
        entityType: 'REFUND',
        entityId: refund.id,
        senderUserId: user.id,
        senderName: user.name || 'Revenue Department',
        senderRole: 'REVENUE',
        eventName: refund.eventName,
      });
    } catch (e) {
      this.logger.warn(`Failed to dispatch REFUND_COMPLETED notification: ${e}`);
    }

    return {
      message: 'Refund successfully completed and recorded.',
      refund: updated,
    };
  }

  // 12. Fail Refund (Revenue Team marks as FAILED)
  async failRefund(id: string, failureReason: string, user: any) {
    this.enforceRevenueProcessor(user);
    const refund = this.refundsRepository.findRefundById(id);
    if (!refund) {
      throw new NotFoundException(`Refund '${id}' not found.`);
    }

    if (!failureReason || !failureReason.trim()) {
      throw new BadRequestException('A failure reason is required.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = this.refundsRepository.updateRefund(id, {
      status: 'FAILED',
      failureReason: failureReason.trim(),
      failedAt: nowStr,
      updatedAt: nowStr,
    })!;

    this.refundsRepository.createAuditLog({
      id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
      refundId: id,
      actorUserId: user.id,
      actorName: user.name || 'Revenue Specialist',
      actorRole: user.role || 'REVENUE',
      action: 'FAILED',
      previousStatus: refund.status,
      newStatus: 'FAILED',
      notes: `Refund processing failed: ${failureReason.trim()}`,
      createdAt: nowStr,
    });

    return { message: 'Refund status set to FAILED.', refund: updated };
  }

  // 12.1. Cancellation Preview & Refund Calculation (6-tier policy)
  async getCancellationPreview(eventId: string, user: any) {
    if (!eventId) {
      throw new BadRequestException('Event ID is required.');
    }

    const event = this.store.findById<any>('events', eventId);
    const eventReq = this.store.findById<any>('event_requests', eventId);

    if (!event && !eventReq) {
      throw new NotFoundException(`Event '${eventId}' not found.`);
    }

    const targetReq = eventReq || (event ? this.store.findById<any>('event_requests', event.id) : null);
    const targetReqId = eventReq ? eventReq.id : (event ? event.id : null);
    const clientReqId = targetReqId || eventId;

    const quotation = this.store.findOne<any>(
      'quotations',
      (q) => q.eventRequestId === clientReqId,
    );

    let totalClientPaid = 0;
    if (quotation) {
      const clientPayments = this.store.find<any>(
        'payments',
        (p) =>
          (p.quotationId === quotation.id || (!p.quotationId && p.eventRequestId === clientReqId)) &&
          p.status === 'SUCCESS',
      );
      totalClientPaid = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }

    const eventStartDateStr = event?.startDate || event?.date || eventReq?.startDate || eventReq?.eventDate || '';
    const eventStartTimeStr = event?.startTime || eventReq?.startTime || '09:00 AM';
    const eventDateTime = parseEventDateTime(eventStartDateStr, eventStartTimeStr) || new Date(eventStartDateStr);

    const isAlreadyCancelled =
      event?.status === 'CANCELLED' ||
      event?.operationalStatus === 'CANCELLED' ||
      eventReq?.status === 'CANCELLED' ||
      eventReq?.operationalStatus === 'CANCELLED';

    const isStartedOrCompleted =
      ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(event?.status) ||
      ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(event?.operationalStatus) ||
      ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(eventReq?.status) ||
      ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(eventReq?.operationalStatus);

    const hasStartedByTime = eventDateTime && eventDateTime.getTime() <= Date.now();

    const tierInfo = computeClientCancellationTier(eventDateTime, totalClientPaid, new Date());

    if (isAlreadyCancelled) {
      tierInfo.isPermitted = false;
      tierInfo.restrictionReason = 'This event has already been cancelled.';
    } else if (isStartedOrCompleted || hasStartedByTime) {
      tierInfo.isPermitted = false;
      tierInfo.restrictionReason = 'This event cannot be cancelled because it has already started or has been completed.';
    }

    return {
      eventId,
      eventName: event?.name || eventReq?.eventName || 'Event',
      organizationName: event?.organizationName || eventReq?.organizationName || '',
      eventDate: eventStartDateStr,
      startTime: eventStartTimeStr,
      ...tierInfo,
    };
  }

  // 13. Event Cancellation Integration
  async cancelEvent(eventId: string, dto: CancelEventDto, user: any) {
    if (!eventId) {
      throw new BadRequestException('Event ID is required.');
    }
    if (!dto.cancellationReason || !dto.cancellationReason.trim()) {
      throw new BadRequestException('A cancellation reason is required.');
    }

    // Role verification:
    // Event Manager can cancel their assigned events
    // Client can cancel their own event
    // Department Manager and Super Admin can cancel
    const event = this.store.findById<any>('events', eventId);
    const eventReq = this.store.findById<any>('event_requests', eventId);

    if (!event && !eventReq) {
      throw new NotFoundException(`Event '${eventId}' not found.`);
    }

    const targetReq = eventReq || (event ? this.store.findById<any>('event_requests', event.id) : null);
    const isOwnerClient = targetReq && targetReq.userId === user.id;
    const isAssignedManager = targetReq && (targetReq.eventManagerUserId === user.id || targetReq.assignedManagerUserId === user.id);
    const isEventManager = user.role === 'EVENT_MANAGER';
    const isDeptManager = user.role === 'DEPARTMENT_MANAGER';
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    const canCancel = isOwnerClient || isAssignedManager || isEventManager || isDeptManager || isSuperAdmin;
    if (!canCancel) {
      throw new ForbiddenException('You do not have permission to initiate cancellation for this event.');
    }

    // Check if event is already cancelled
    const isAlreadyCancelled =
      event?.status === 'CANCELLED' ||
      event?.operationalStatus === 'CANCELLED' ||
      eventReq?.status === 'CANCELLED' ||
      eventReq?.operationalStatus === 'CANCELLED';
    if (isAlreadyCancelled) {
      throw new ConflictException('This event has already been cancelled.');
    }

    const eventName = event?.name || eventReq?.eventName || 'Event';
    const orgName = event?.organizationName || eventReq?.organizationName || '';
    const eventDate = event?.date || eventReq?.eventDate || eventReq?.startDate || '';
    const eventStartTimeStr = event?.startTime || eventReq?.startTime || '09:00 AM';
    const eventDateTime = parseEventDateTime(eventDate, eventStartTimeStr) || new Date(eventDate);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const isStartedOrCompleted =
      ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(event?.status) ||
      ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(event?.operationalStatus) ||
      ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(eventReq?.status) ||
      ['COMPLETED', 'ONGOING', 'IN_PROGRESS', 'LIVE'].includes(eventReq?.operationalStatus);

    const hasStartedByTime = eventDateTime && eventDateTime.getTime() <= Date.now();

    const targetReqId = eventReq ? eventReq.id : (event ? event.id : null);
    const clientReqId = targetReqId || eventId;

    const quotation = this.store.findOne<any>(
      'quotations',
      (q) => q.eventRequestId === clientReqId,
    );

    let totalClientPaid = 0;
    if (quotation) {
      const clientPayments = this.store.find<any>(
        'payments',
        (p) =>
          (p.quotationId === quotation.id || (!p.quotationId && p.eventRequestId === clientReqId)) &&
          p.status === 'SUCCESS',
      );
      totalClientPaid = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }

    const clientTierInfo = computeClientCancellationTier(eventDateTime, totalClientPaid, new Date());

    if (user.role === 'CLIENT' || isOwnerClient) {
      if (isStartedOrCompleted || hasStartedByTime || !clientTierInfo.isPermitted) {
        throw new ConflictException(
          'This event cannot be cancelled because it has already started or has been completed.',
        );
      }
    }

    // 1. Update event records to CANCELLED
    if (event) {
      this.store.update<any>('events', event.id, {
        status: 'CANCELLED',
        cancellationReason: dto.cancellationReason.trim(),
        cancellationPolicyTier: clientTierInfo.tierName,
        refundPercentage: clientTierInfo.refundPercentage,
        refundAmount: clientTierInfo.refundableAmount,
        deductionAmount: clientTierInfo.deductionAmount,
        cancellationStatus: 'CANCELLED',
        cancellationDate: nowStr,
        cancellationInitiatorId: user.id,
        cancellationInitiatorName: user.name || 'User',
        cancellationInitiatorRole: user.role || 'USER',
        cancellationTimestamp: nowStr,
        updatedAt: nowStr,
      });
    }

    if (targetReqId) {
      this.store.update<any>('event_requests', targetReqId, {
        status: 'CANCELLED',
        operationalStatus: 'CANCELLED',
        cancellationReason: dto.cancellationReason.trim(),
        cancellationPolicyTier: clientTierInfo.tierName,
        refundPercentage: clientTierInfo.refundPercentage,
        refundAmount: clientTierInfo.refundableAmount,
        deductionAmount: clientTierInfo.deductionAmount,
        cancellationStatus: 'CANCELLED',
        cancellationDate: nowStr,
        cancellationInitiatorId: user.id,
        cancellationInitiatorName: user.name || 'User',
        cancellationInitiatorRole: user.role || 'USER',
        cancellationTimestamp: nowStr,
        updatedAt: nowStr,
      });
    }

    const createdRefunds: RefundRecord[] = [];
    const cancellationType = (user.role === 'CLIENT' || isOwnerClient) ? 'CLIENT_CANCELLED' : 'ORGANIZER_CANCELLED';

    // 2. Identify all associated attendee ticket purchases
    const allTickets = this.store.findAll<any>('tickets');
    const eventTickets = allTickets.filter(
      (t) => (t.eventId === eventId || (targetReqId && t.eventId === targetReqId)) &&
             t.registrationStatus !== 'REFUNDED' &&
             t.paymentStatus !== 'FAILED',
    );

    for (const tkt of eventTickets) {
      // DUPLICATE PREVENTON: Skip if refund already exists for this ticket
      const existing = this.refundsRepository.findRefundByTicketId(tkt.id);
      if (existing) {
        continue;
      }

      const attendeeUser = this.store.findById<any>('users', tkt.userId);
      const totalTicketAmt = Number(
        tkt.totalAmount || (Number(tkt.unitPrice || 0) * (tkt.quantity || 1) + Number(tkt.platformFee || 0)),
      );

      // Attendee Refund Policy (B2C): 100% refund including ticket price + platform fee
      const refundId = 'ref_' + crypto.randomBytes(8).toString('hex');
      const refundNumber = 'REF-2026-' + Math.floor(10000 + Math.random() * 90000);

      const refundRecord: RefundRecord = {
        id: refundId,
        refundNumber,
        customerType: 'ATTENDEE',
        customerId: tkt.userId,
        customerName: attendeeUser?.name || 'Attendee',
        customerEmail: attendeeUser?.email || '',
        eventId,
        eventRequestId: targetReqId || undefined,
        eventName,
        organizationName: orgName,
        eventDate,
        ticketId: tkt.id,
        ticketNumber: tkt.ticketNumber,
        ticketQuantity: Number(tkt.quantity) || 1,
        originalPaymentAmount: totalTicketAmt,
        totalPaidAmount: totalTicketAmt,
        deductionAmount: 0,
        refundableAmount: totalTicketAmt,
        status: 'ELIGIBLE',
        cancellationReason: dto.cancellationReason.trim(),
        cancellationInitiatorId: user.id,
        cancellationInitiatorName: user.name || 'User',
        cancellationInitiatorRole: user.role || 'USER',
        cancellationTimestamp: nowStr,
        cancellationType,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      const saved = this.refundsRepository.createRefund(refundRecord);
      createdRefunds.push(saved);

      this.refundsRepository.createAuditLog({
        id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
        refundId,
        actorUserId: user.id,
        actorName: user.name || 'System',
        actorRole: user.role || 'SYSTEM',
        action: 'ELIGIBLE',
        newStatus: 'ELIGIBLE',
        notes: `Event cancelled by ${user.role}. Attendee is eligible for 100% refund of ₹${totalTicketAmt.toLocaleString()}.`,
        createdAt: nowStr,
      });

      // Update ticket registration status
      this.store.update<any>('tickets', tkt.id, {
        registrationStatus: 'CANCELLED',
        cancellationReason: dto.cancellationReason.trim(),
        updatedAt: nowStr,
      });

      // Notify Attendee
      try {
        this.notificationHelper.createNotification({
          recipientUserId: tkt.userId,
          type: 'EVENT_CANCELLED',
          title: `Event Cancelled: "${eventName}"`,
          message: `The event "${eventName}" scheduled for ${eventDate} has been cancelled. Reason: ${dto.cancellationReason.trim()}. You are eligible for a 100% refund of ₹${totalTicketAmt.toLocaleString()}.`,
          entityType: 'REFUND',
          entityId: refundId,
          eventName,
        });
      } catch (e) {
        this.logger.warn(`Failed to dispatch attendee cancellation notification: ${e}`);
      }
    }

    // 3. Identify associated client quotation & payment records (B2B)
    if (quotation) {
      // DUPLICATE PREVENTION: Skip if refund already exists for this quotation
      const existingClientRefund = this.refundsRepository.findRefundByQuotationId(quotation.id);
      if (!existingClientRefund) {
        const clientPayments = this.store.find<any>(
          'payments',
          (p) => (p.quotationId === quotation.id || (!p.quotationId && p.eventRequestId === clientReqId)) && p.status === 'SUCCESS',
        );

        const totalClientPaid = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        if (totalClientPaid > 0) {
          const clientUser = this.store.findById<any>('users', quotation.createdByUserId || targetReq?.userId);
          const refundId = 'ref_' + crypto.randomBytes(8).toString('hex');
          const refundNumber = 'REF-2026-' + Math.floor(10000 + Math.random() * 90000);

          // Determine work stage and preliminary deductions per B2B policy:
          // Wavevents cancels before work begins: 100% refund
          // Wavevents cancels after work begins: deduct verified non-recoverable expenses
          // Client cancels before work begins: apply cancellation charges agreed in contract (preliminary 10%)
          // Client cancels after work begins: deduct completed work & verified expenses
          const workStarted = dto.workStarted || ['IN_PREPARATION', 'READY', 'LIVE'].includes(targetReq?.operationalStatus);
          let preliminaryDeduction = 0;
          let preliminaryReason = '';

          if (user.role === 'CLIENT' || isOwnerClient) {
            preliminaryDeduction = clientTierInfo.deductionAmount;
            preliminaryReason = `Cancellation Policy: ${clientTierInfo.tierName} (${clientTierInfo.deductionPercentage}% deduction).`;
          } else {
            // Organizer / Wavevents cancelled
            if (!workStarted) {
              preliminaryDeduction = 0;
              preliminaryReason = 'Full 100% refund. Wavevents cancellation before operational work commenced.';
            } else {
              preliminaryDeduction = 0;
              preliminaryReason = 'Subject to verified non-recoverable expenses review by Revenue Team.';
            }
          }

          const preliminaryRefundable = Math.max(0, totalClientPaid - preliminaryDeduction);

          const clientRefundRecord: RefundRecord = {
            id: refundId,
            refundNumber,
            customerType: 'CLIENT',
            customerId: targetReq?.userId || quotation.createdByUserId,
            customerName: targetReq?.organizationName || clientUser?.name || 'Corporate Client',
            customerEmail: targetReq?.contactEmail || clientUser?.email || '',
            eventId,
            eventRequestId: clientReqId,
            eventName,
            organizationName: orgName,
            eventDate,
            quotationId: quotation.id,
            originalPaymentAmount: totalClientPaid,
            totalPaidAmount: totalClientPaid,
            deductionAmount: preliminaryDeduction,
            deductionReason: preliminaryReason,
            refundableAmount: preliminaryRefundable,
            status: 'UNDER_REVIEW', // Client refunds start under review by Revenue team
            cancellationReason: dto.cancellationReason.trim(),
            cancellationInitiatorId: user.id,
            cancellationInitiatorName: user.name || 'User',
            cancellationInitiatorRole: user.role || 'USER',
            cancellationTimestamp: nowStr,
            cancellationType,
            cancellationTerms: 'Governed by agreed 3-stage payment plan (35% Advance, 45% Milestone, 20% Final) and contractual deduction clauses.',
            createdAt: nowStr,
            updatedAt: nowStr,
          };

          const savedClient = this.refundsRepository.createRefund(clientRefundRecord);
          createdRefunds.push(savedClient);

          this.refundsRepository.createAuditLog({
            id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
            refundId,
            actorUserId: user.id,
            actorName: user.name || 'System',
            actorRole: user.role || 'SYSTEM',
            action: 'UNDER_REVIEW',
            newStatus: 'UNDER_REVIEW',
            notes: `Event cancelled by ${user.role}. Client refund record created. Paid: ₹${totalClientPaid.toLocaleString()}, Preliminary Deduction: ₹${preliminaryDeduction.toLocaleString()}. Revenue Team review required.`,
            createdAt: nowStr,
          });

          // Notify Client
          try {
            this.notificationHelper.createNotification({
              recipientUserId: targetReq?.userId || quotation.createdByUserId,
              type: 'EVENT_CANCELLED',
              title: `Commercial Event Cancelled: "${eventName}"`,
              message: `Event "${eventName}" has been cancelled. Reason: ${dto.cancellationReason.trim()}. Total amount paid of ₹${totalClientPaid.toLocaleString()} is queued for Revenue Team refund review.`,
              entityType: 'REFUND',
              entityId: refundId,
              eventName,
            });
          } catch (e) {
            this.logger.warn(`Failed to dispatch client cancellation notification: ${e}`);
          }
        }
      }
    }

    // 4. Notify Revenue Team Users about event cancellation and new refund records
    try {
      const revenueUsers = this.store.find<any>(
        'users',
        (u) => u.role === 'REVENUE' || (u.role === 'DEPARTMENT_MANAGER' && u.department === 'REVENUE'),
      );
      for (const revUser of revenueUsers) {
        this.notificationHelper.createNotification({
          recipientUserId: revUser.id,
          type: 'EVENT_CANCELLED_REFUNDS_PENDING',
          title: `Action Required: Event Cancelled (${eventName})`,
          message: `"${eventName}" was cancelled by ${user.name} (${user.role}). ${createdRefunds.length} refund record(s) generated for Revenue Team review and processing.`,
          entityType: 'EVENT',
          entityId: eventId,
          eventName,
        });
      }
    } catch (e) {
      this.logger.warn(`Failed to notify Revenue team: ${e}`);
    }

    return {
      message: `Event '${eventName}' successfully cancelled. ${createdRefunds.length} refund eligibility record(s) generated.`,
      cancelledEventId: eventId,
      refundsCreatedCount: createdRefunds.length,
      refunds: createdRefunds,
    };
  }

  // 14. Event Postponement Integration
  async postponeEvent(eventId: string, dto: PostponeEventDto, user: any) {
    if (!eventId) {
      throw new BadRequestException('Event ID is required.');
    }
    if (!dto.newDate || !dto.reason) {
      throw new BadRequestException('New scheduled date and postponement reason are required.');
    }

    const event = this.store.findById<any>('events', eventId);
    const eventReq = this.store.findById<any>('event_requests', eventId);

    if (!event && !eventReq) {
      throw new NotFoundException(`Event '${eventId}' not found.`);
    }

    const targetReq = eventReq || (event ? this.store.findById<any>('event_requests', event.id) : null);
    const isOwnerClient = targetReq && targetReq.userId === user.id;
    const isAssignedManager = targetReq && (targetReq.eventManagerUserId === user.id || targetReq.assignedManagerUserId === user.id);
    const isEventManager = user.role === 'EVENT_MANAGER';
    const isDeptManager = user.role === 'DEPARTMENT_MANAGER';
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    if (!isOwnerClient && !isAssignedManager && !isEventManager && !isDeptManager && !isSuperAdmin) {
      throw new ForbiddenException('You do not have permission to postpone this event.');
    }

    const eventName = event?.name || eventReq?.eventName || 'Event';
    const previousDate = event?.date || eventReq?.eventDate || eventReq?.startDate || '';
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update event date, postpone flags without cancelling
    if (event) {
      this.store.update<any>('events', event.id, {
        date: dto.newDate,
        startTime: dto.newStartTime || event.startTime,
        endTime: dto.newEndTime || event.endTime,
        isPostponed: true,
        previousDate,
        postponedReason: dto.reason.trim(),
        postponedByUserId: user.id,
        postponedAt: nowStr,
        updatedAt: nowStr,
      });
    }

    const targetReqId = eventReq ? eventReq.id : (event ? event.id : null);
    if (targetReqId) {
      this.store.update<any>('event_requests', targetReqId, {
        startDate: dto.newDate,
        eventDate: dto.newDate,
        startTime: dto.newStartTime || targetReq?.startTime,
        endTime: dto.newEndTime || targetReq?.endTime,
        isPostponed: true,
        previousDate,
        postponedReason: dto.reason.trim(),
        postponedByUserId: user.id,
        postponedAt: nowStr,
        updatedAt: nowStr,
      });
    }

    // For all attendees with confirmed tickets, notify them of new date and option to retain ticket or request refund
    const allTickets = this.store.findAll<any>('tickets');
    const eventTickets = allTickets.filter(
      (t) => (t.eventId === eventId || (targetReqId && t.eventId === targetReqId)) &&
             t.registrationStatus === 'ACTIVE',
    );

    let createdEligibilityCount = 0;
    for (const tkt of eventTickets) {
      const existing = this.refundsRepository.findRefundByTicketId(tkt.id);
      if (!existing) {
        const attendeeUser = this.store.findById<any>('users', tkt.userId);
        const totalTicketAmt = Number(
          tkt.totalAmount || (Number(tkt.unitPrice || 0) * (tkt.quantity || 1) + Number(tkt.platformFee || 0)),
        );

        const refundId = 'ref_' + crypto.randomBytes(8).toString('hex');
        const refundNumber = 'REF-2026-' + Math.floor(10000 + Math.random() * 90000);

        this.refundsRepository.createRefund({
          id: refundId,
          refundNumber,
          customerType: 'ATTENDEE',
          customerId: tkt.userId,
          customerName: attendeeUser?.name || 'Attendee',
          customerEmail: attendeeUser?.email || '',
          eventId,
          eventRequestId: targetReqId || undefined,
          eventName,
          organizationName: event?.organizationName || eventReq?.organizationName || '',
          eventDate: dto.newDate,
          ticketId: tkt.id,
          ticketNumber: tkt.ticketNumber,
          ticketQuantity: Number(tkt.quantity) || 1,
          originalPaymentAmount: totalTicketAmt,
          totalPaidAmount: totalTicketAmt,
          deductionAmount: 0,
          refundableAmount: totalTicketAmt,
          status: 'ELIGIBLE',
          cancellationReason: `Event Postponed: ${dto.reason.trim()} (New Date: ${dto.newDate})`,
          cancellationType: 'POSTPONED_REFUND_REQUEST',
          isPostponedEvent: true,
          retainedTicket: false,
          createdAt: nowStr,
          updatedAt: nowStr,
        });

        createdEligibilityCount++;
      }

      // Notify attendee of postponement
      try {
        this.notificationHelper.createNotification({
          recipientUserId: tkt.userId,
          type: 'EVENT_POSTPONED',
          title: `Event Postponed: "${eventName}"`,
          message: `"${eventName}" has been rescheduled from ${previousDate} to ${dto.newDate}. Reason: ${dto.reason.trim()}. You can retain your ticket for the new date or request a 100% refund.`,
          entityType: 'EVENT',
          entityId: eventId,
          eventName,
        });
      } catch (e) {
        this.logger.warn(`Failed to notify attendee about postponement: ${e}`);
      }
    }

    return {
      message: `Event '${eventName}' rescheduled to ${dto.newDate}. Event remains active. Attendees notified of ticket retention or refund choice.`,
      eventId,
      newDate: dto.newDate,
      eligibilityRecordsCreated: createdEligibilityCount,
    };
  }

  // 15. Attendee elects to retain ticket for postponed event
  async retainTicket(refundId: string, user: any) {
    const refund = this.refundsRepository.findRefundById(refundId);
    if (!refund) {
      throw new NotFoundException(`Refund '${refundId}' not found.`);
    }

    if (refund.customerId !== user.id && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('You can only manage your own ticket refunds.');
    }

    if (!refund.isPostponedEvent) {
      throw new BadRequestException('Ticket retention is only applicable for postponed events.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update refund as retained
    const updated = this.refundsRepository.updateRefund(refundId, {
      retainedTicket: true,
      status: 'REJECTED',
      rejectionReason: 'Attendee elected to retain ticket for the rescheduled event date.',
      updatedAt: nowStr,
    })!;

    // Ensure ticket remains ACTIVE
    if (refund.ticketId) {
      this.store.update<any>('tickets', refund.ticketId, {
        registrationStatus: 'ACTIVE',
        updatedAt: nowStr,
      });
    }

    this.refundsRepository.createAuditLog({
      id: 'rlog_' + crypto.randomBytes(8).toString('hex'),
      refundId,
      actorUserId: user.id,
      actorName: user.name || 'Attendee',
      actorRole: user.role || 'ATTENDEE',
      action: 'RETAINED_TICKET',
      notes: 'Attendee elected to retain their ticket registration for the new event date.',
      createdAt: nowStr,
    });

    return {
      message: 'Ticket confirmed for rescheduled date. Refund request closed.',
      refund: updated,
    };
  }
}

