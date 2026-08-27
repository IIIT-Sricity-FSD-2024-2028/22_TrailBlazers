import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import { NestLoggerService } from '../common/logging/logger.service';

@Injectable()
export class QuotationsRepository {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  findQuotationById(id: string): any | null {
    if (!id) return null;
    return this.store.findById('quotations', id);
  }

  findQuotationByEventRequestId(eventRequestId: string): any | null {
    if (!eventRequestId) return null;
    return this.store.findOne('quotations', (q) => q.eventRequestId === eventRequestId);
  }

  findActiveVersion(quotationId: string, versionNumber: number): any | null {
    if (!quotationId || !versionNumber) return null;
    return this.store.findOne(
      'quotation_versions',
      (v) => v.quotationId === quotationId && Number(v.versionNumber) === Number(versionNumber),
    );
  }

  findLineItemsByVersionId(versionId: string): any[] {
    if (!versionId) return [];
    return this.store.find('quotation_line_items', (l) => l.versionId === versionId);
  }

  findVersionHistory(quotationId: string): any[] {
    if (!quotationId) return [];
    return this.store
      .find<any>('quotation_versions', (v) => v.quotationId === quotationId)
      .sort((a, b) => Number(b.versionNumber) - Number(a.versionNumber))
      .map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        totalAmount: v.totalAmount,
        status: v.status,
        createdAt: v.createdAt,
      }));
  }

  findAuditLogs(quotationId: string): any[] {
    if (!quotationId) return [];
    return this.store
      .find<any>('quotation_audit_logs', (a) => a.quotationId === quotationId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  findChangeRequests(quotationId: string): any[] {
    if (!quotationId) return [];
    return this.store
      .find<any>('quotation_change_requests', (c) => c.quotationId === quotationId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  saveQuotationTransaction(params: {
    eventRequestId: string;
    actorUserId: string;
    actorName: string;
    existingQuotation: any | null;
    validItems: {
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[];
    subtotal: number;
    numDiscount: number;
    numTaxPercent: number;
    taxAmount: number;
    totalAmount: number;
    notes: string;
    terms: string;
    qtnId: string;
    versionId: string;
    versionNumber: number;
    auditLogId: string;
  }) {
    const {
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
    } = params;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (!existingQuotation) {
      this.store.create('quotations', {
        id: qtnId,
        eventRequestId,
        assignedRevenueUserId: actorUserId,
        currentVersion: 1,
        status: 'FINALIZED',
        createdByUserId: actorUserId,
        createdAt: nowStr,
        updatedAt: nowStr,
      });
    } else {
      this.store.update<any>('quotations', qtnId, {
        currentVersion: versionNumber,
        status: 'FINALIZED',
        updatedAt: nowStr,
      });
    }

    this.store.create('quotation_versions', {
      id: versionId,
      quotationId: qtnId,
      versionNumber,
      subtotal,
      discount: numDiscount,
      taxPercent: numTaxPercent,
      taxAmount,
      totalAmount,
      notes,
      terms,
      status: 'FINALIZED',
      createdByUserId: actorUserId,
      createdAt: nowStr,
    });

    for (const item of validItems) {
      this.store.create('quotation_line_items', {
        id: item.id,
        versionId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      });
    }

    // Update event request status
    this.store.update<any>('event_requests', eventRequestId, {
      status: 'PRICING',
      updatedAt: nowStr,
    });

    // Audit Log
    this.store.create('quotation_audit_logs', {
      id: auditLogId,
      quotationId: qtnId,
      versionId,
      actorUserId,
      actorName,
      action: 'FINALIZED_QUOTATION',
      details: `Generated finalized quotation version V${versionNumber} for ₹${totalAmount.toLocaleString()}`,
      createdAt: nowStr,
    });

    return { qtnId, versionId, versionNumber, totalAmount };
  }

  sendQuotationTransaction(params: {
    quotationId: string;
    activeVersionId: string;
    eventRequestId: string;
    versionNumber: number;
    totalAmount: number;
    actorUserId: string;
    actorName: string;
    auditLogId: string;
  }) {
    const {
      quotationId,
      activeVersionId,
      eventRequestId,
      versionNumber,
      totalAmount,
      actorUserId,
      actorName,
      auditLogId,
    } = params;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.update<any>('quotation_versions', activeVersionId, {
      status: 'FINALIZED',
    });
    this.store.update<any>('quotations', quotationId, {
      status: 'FINALIZED',
      updatedAt: nowStr,
    });
    this.store.update<any>('event_requests', eventRequestId, {
      status: 'QUOTATION_SENT',
      updatedAt: nowStr,
    });

    this.store.create('quotation_audit_logs', {
      id: auditLogId,
      quotationId,
      versionId: activeVersionId,
      actorUserId,
      actorName,
      action: 'FINALIZED_QUOTATION',
      details: `Finalized quotation V${versionNumber} (Total: ₹${totalAmount.toLocaleString()}) for client view`,
      createdAt: nowStr,
    });
  }

  acceptQuotationTransaction(params: {
    quotationId: string;
    currentVersion: number;
    eventReq: any;
    contractPrice: number;
  }) {
    const { quotationId, currentVersion, eventReq } = params;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.update<any>('quotations', quotationId, {
      status: 'ACCEPTED',
      updatedAt: nowStr,
    });

    const activeVersion = this.store.findOne<any>(
      'quotation_versions',
      (v) => v.quotationId === quotationId && Number(v.versionNumber) === Number(currentVersion),
    );
    if (activeVersion) {
      this.store.update<any>('quotation_versions', activeVersion.id, {
        status: 'ACCEPTED',
      });
    }

    this.store.update<any>('event_requests', eventReq.id, {
      status: 'COMMERCIAL_APPROVED',
      operationalStatus: 'IN_PREPARATION',
      updatedAt: nowStr,
    });

    const existingEvt = this.store.findById('events', eventReq.id);
    if (!existingEvt) {
      this.store.create('events', {
        id: eventReq.id,
        organizerUserId: eventReq.userId,
        name: eventReq.eventName,
        organizationName: eventReq.organizationName || 'Default Org',
        category: eventReq.category || 'General',
        description: eventReq.description || '',
        agenda: eventReq.agenda || '',
        date: eventReq.eventDate || '2026-12-01',
        startTime: eventReq.startTime || '09:00 AM',
        endTime: eventReq.endTime || '05:00 PM',
        venue: eventReq.venue || 'Main Hall',
        location: eventReq.location || 'Primary Location',
        type: eventReq.eventType || 'OPEN',
        ticketPrice: eventReq.ticketPrice || 0,
        availableTickets: eventReq.expectedAttendance || 100,
        totalTickets: eventReq.expectedAttendance || 100,
        status: 'COMMERCIAL_APPROVED',
        createdAt: nowStr,
      });
    } else {
      this.store.update<any>('events', eventReq.id, {
        status: 'COMMERCIAL_APPROVED',
        updatedAt: nowStr,
      });
    }
  }

  rejectQuotationTransaction(params: {
    quotationId: string;
    currentVersion: number;
    eventRequestId: string;
  }) {
    const { quotationId, currentVersion, eventRequestId } = params;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.store.update<any>('quotations', quotationId, {
      status: 'REJECTED',
      updatedAt: nowStr,
    });

    const activeVersion = this.store.findOne<any>(
      'quotation_versions',
      (v) => v.quotationId === quotationId && Number(v.versionNumber) === Number(currentVersion),
    );
    if (activeVersion) {
      this.store.update<any>('quotation_versions', activeVersion.id, {
        status: 'REJECTED',
      });
    }

    this.store.update<any>('event_requests', eventRequestId, {
      status: 'REJECTED',
      updatedAt: nowStr,
    });
  }
}
