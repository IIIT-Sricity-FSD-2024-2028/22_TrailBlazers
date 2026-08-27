import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { EventManagerRepository } from '../../repositories/event-manager.repository';
import { QuotationsRepository } from '../../repositories/quotations.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { NestLoggerService } from '../../common/logging/logger.service';
import { UpdateEventConfigDto } from './dto/update-event-config.dto';
import { AssignCoordinatorDto } from './dto/assign-coordinator.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { IssueInvitationDto } from './dto/issue-invitation.dto';

@Injectable()
export class EventManagerService {
  constructor(
    private readonly repository: EventManagerRepository,
    private readonly quotationsRepository: QuotationsRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly logger: NestLoggerService,
  ) {}

  calculateEventReadiness(request: any, invitationsCount = 0) {
    const items: any[] = [];
    const missingItems: string[] = [];

    // 1. Commercial Approval Check
    const isCommerciallyApproved =
      request.status === 'COMMERCIAL_APPROVED' || request.status === 'ACCEPTED';
    items.push({
      id: 'commercial_approval',
      label: 'Commercial Approval Received',
      passed: isCommerciallyApproved,
      required: true,
    });
    if (!isCommerciallyApproved)
      missingItems.push('Commercial Approval from Revenue & Client');

    // 2. Required Event Info & Venue Setup
    const hasEventInfo = !!(
      request.eventName &&
      request.venue &&
      request.eventDate
    );
    items.push({
      id: 'event_info',
      label: 'Venue & Event Schedule Configured',
      passed: hasEventInfo,
      required: true,
    });
    if (!hasEventInfo)
      missingItems.push('Event Venue or Date Schedule missing');

    // 3. Operational Registration Setup
    const hasRegDeadline = !!(
      request.registrationDeadline || request.eventDate
    );
    items.push({
      id: 'registration_config',
      label: 'Registration Status & Deadline Set',
      passed: hasRegDeadline,
      required: true,
    });
    if (!hasRegDeadline) missingItems.push('Registration Deadline');

    // 4. Onsite Coordinator Assignment
    const hasCoordinator = !!request.onsiteCoordinatorUserId;
    items.push({
      id: 'coordinator_assignment',
      label: 'Onsite Coordinator Assigned',
      passed: hasCoordinator,
      required: true,
    });
    if (!hasCoordinator) missingItems.push('Onsite Coordinator Assignment');

    // 5. Conditional Private Invitations Check (Required ONLY if eventType is CLOSED/Private)
    const isClosedEvent = (
      request.eventType ||
      request.accessType ||
      ''
    ).toUpperCase() === 'CLOSED';
    if (isClosedEvent) {
      const hasInvitations = invitationsCount > 0;
      items.push({
        id: 'private_invitations',
        label: 'Private Event Invitations Configured',
        passed: hasInvitations,
        required: true,
      });
      if (!hasInvitations) missingItems.push('Private Event Invitation Setup');
    } else {
      items.push({
        id: 'private_invitations',
        label: 'Private Event Invitations (Not Applicable for Open Event)',
        passed: true,
        required: false,
      });
    }

    // 6. Conditional Payment Readiness (Not required for free events)
    const isPaidEvent =
      request.isPaid === 1 || (request.ticketPrice || 0) > 0;
    if (isPaidEvent) {
      items.push({
        id: 'payment_config',
        label: 'Commercially Approved Ticket Pricing Active',
        passed: true,
        required: true,
      });
    } else {
      items.push({
        id: 'payment_config',
        label: 'Free Event Pricing (No Payment Setup Required)',
        passed: true,
        required: false,
      });
    }

    const requiredItems = items.filter((i) => i.required);
    const passedRequired = requiredItems.filter((i) => i.passed);
    const percent =
      requiredItems.length > 0
        ? Math.round((passedRequired.length / requiredItems.length) * 100)
        : 100;
    const isReady = missingItems.length === 0;

    return { percent, isReady, items, missingItems };
  }

  getDashboard() {
    const metrics = this.repository.getDashboardMetrics();
    const priorityEvents = this.repository.getPriorityEvents(10);

    const enrichedEvents = priorityEvents.map((evt) => {
      const invCount = this.repository.countInvitations(evt.id);
      const readiness = this.calculateEventReadiness(evt, invCount);
      return {
        ...evt,
        readinessPercent: readiness.percent,
        isReady: readiness.isReady,
        missingItems: readiness.missingItems,
      };
    });

    return { metrics, priorityEvents: enrichedEvents };
  }

  getEvents(filters: { search?: string; status?: string }) {
    const events = this.repository.findEvents(filters);

    const enrichedEvents = events.map((evt) => {
      const invCount = this.repository.countInvitations(evt.id);
      const readiness = this.calculateEventReadiness(evt, invCount);
      return {
        ...evt,
        readinessPercent: readiness.percent,
        isReady: readiness.isReady,
        missingItems: readiness.missingItems,
      };
    });

    return { events: enrichedEvents };
  }

  getEventDetails(id: string, user: any) {
    const request = this.repository.findEventDetailsById(id);
    if (!request) {
      throw new NotFoundException('Commercially approved event not found.');
    }

    // Auto-transition status to IN_PREPARATION when opened if still COMMERCIAL_APPROVED or unassigned
    if (
      !request.operationalStatus ||
      request.operationalStatus === 'COMMERCIAL_APPROVED'
    ) {
      const isNewAssignment = !request.eventManagerUserId;
      this.repository.autoAssignManager(id, user.id);
      request.operationalStatus = 'IN_PREPARATION';
      request.eventManagerUserId = user.id;

      if (isNewAssignment && request.userId) {
        try {
          this.notificationHelper.createNotification({
            recipientUserId: request.userId,
            type: 'EVENT_MANAGER_ASSIGNED',
            title: 'Event Manager Assigned',
            message: `${user.name} (Event Manager) approved your event request and is now primary contact for "${request.eventName}".`,
            entityType: 'EVENT_REQUEST',
            entityId: id,
            senderUserId: user.id,
            senderName: user.name,
            senderRole: 'Event Manager',
            eventName: request.eventName,
            deduplicate: true,
          });
        } catch (notifErr) {
          this.logger.error(
            'Failed to notify client of Event Manager assignment',
            notifErr instanceof Error ? notifErr.stack : undefined,
            'EVENT_MANAGER_SERVICE',
          );
        }
      }
    }

    const quotation =
      this.quotationsRepository.findQuotationByEventRequestId(id);
    let activeVersion: any = null;
    let lineItems: any[] = [];
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
    }

    const invitations = this.repository.findInvitationsByEventId(id);
    const readiness = this.calculateEventReadiness(request, invitations.length);
    const auditLogs = this.repository.findAuditLogsByEventRequestId(id);

    return {
      request,
      quotation,
      activeVersion,
      lineItems,
      invitations,
      readiness,
      auditLogs,
    };
  }

  updateConfiguration(id: string, dto: UpdateEventConfigDto, user: any) {
    const {
      registrationStatus,
      registrationDeadline,
      expectedAttendance,
      ticketPrice,
    } = dto;
    const actorUserId = user.id;
    const actorName = user.name || 'Event Manager';

    // Commercial Boundary Check: Reject any attempt to alter ticket price
    if (ticketPrice !== undefined) {
      const existingReq = this.repository.findEventDetailsById(id);
      if (
        existingReq &&
        Number(ticketPrice) !== Number(existingReq.ticketPrice)
      ) {
        throw new BadRequestException(
          'Forbidden: Ticket price is commercially agreed and READ-ONLY for Event Managers. Price modifications must be processed through the Revenue Team quotation workflow.',
        );
      }
    }

    const targetReq = this.repository.findEventDetailsById(id);
    if (!targetReq) {
      throw new NotFoundException('Event request not found.');
    }

    const regStatus =
      registrationStatus || targetReq.registrationStatus || 'OPEN';
    const regDeadline =
      registrationDeadline ||
      targetReq.registrationDeadline ||
      targetReq.eventDate;
    const capacity = expectedAttendance
      ? Number(expectedAttendance)
      : targetReq.expectedAttendance;

    const auditLogId = 'eolog_' + crypto.randomBytes(8).toString('hex');

    this.repository.updateEventConfig({
      id,
      regStatus,
      regDeadline,
      capacity,
      auditLogId,
      actorUserId,
      actorName,
    });

    return {
      message: 'Event operational configuration updated successfully.',
      registrationStatus: regStatus,
      registrationDeadline: regDeadline,
      expectedAttendance: capacity,
    };
  }

  getCoordinators() {
    const coordinators = this.repository.findCoordinators();
    return { coordinators };
  }

  assignCoordinator(id: string, dto: AssignCoordinatorDto, user: any) {
    const { coordinatorUserId } = dto;
    const actorUserId = user.id;
    const actorName = user.name || 'Event Manager';

    if (!coordinatorUserId) {
      throw new BadRequestException('Coordinator User ID is required.');
    }

    const targetCoordinator = this.repository.findUserById(coordinatorUserId);
    if (
      !targetCoordinator ||
      targetCoordinator.role !== 'ONSITE_COORDINATOR'
    ) {
      throw new BadRequestException(
        'Invalid coordinator assignment. Selected user does NOT have the ONSITE_COORDINATOR role.',
      );
    }

    const targetReq = this.repository.findEventDetailsById(id);
    if (!targetReq) {
      throw new NotFoundException('Event request not found.');
    }

    const auditLogId = 'eolog_' + crypto.randomBytes(8).toString('hex');

    this.repository.assignCoordinator({
      id,
      coordinatorUserId,
      auditLogId,
      actorUserId,
      actorName,
      coordinatorName: targetCoordinator.name,
      coordinatorEmail: targetCoordinator.email,
    });

    // Notify assigned Onsite Coordinator & Client
    try {
      this.notificationHelper.createNotification({
        recipientUserId: coordinatorUserId,
        type: 'COORDINATOR_ASSIGNED',
        title: 'New Event Assigned',
        message: `${actorName} (Event Manager) assigned you as the Onsite Coordinator for "${targetReq.eventName}".`,
        entityType: 'EVENT_REQUEST',
        entityId: id,
        senderUserId: actorUserId,
        senderName: actorName,
        senderRole: 'Event Manager',
        eventName: targetReq.eventName,
        deduplicate: true,
      });

      if (targetReq.userId) {
        this.notificationHelper.createNotification({
          recipientUserId: targetReq.userId,
          type: 'COORDINATOR_ASSIGNED_CLIENT',
          title: 'Event Team Update',
          message: `An Onsite Coordinator (${targetCoordinator.name}) has been assigned to your event "${targetReq.eventName}".`,
          entityType: 'EVENT_REQUEST',
          entityId: id,
          senderUserId: actorUserId,
          senderName: actorName,
          senderRole: 'Event Manager',
          eventName: targetReq.eventName,
          deduplicate: true,
        });
      }
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch COORDINATOR_ASSIGNED notification',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'EVENT_MANAGER_SERVICE',
      );
    }

    return {
      message: `Onsite Coordinator ${targetCoordinator.name} assigned successfully!`,
      coordinator: {
        id: targetCoordinator.id,
        name: targetCoordinator.name,
        email: targetCoordinator.email,
      },
    };
  }

  getReadiness(id: string) {
    const request = this.repository.findEventDetailsById(id);
    if (!request) {
      throw new NotFoundException('Event request not found.');
    }

    const invCount = this.repository.countInvitations(id);
    const readiness = this.calculateEventReadiness(request, invCount);

    return { readiness };
  }

  markEventReady(id: string, user: any) {
    const actorUserId = user.id;
    const actorName = user.name || 'Event Manager';

    const request = this.repository.findEventDetailsById(id);
    if (!request) {
      throw new NotFoundException('Event request not found.');
    }

    const invCount = this.repository.countInvitations(id);
    const readiness = this.calculateEventReadiness(request, invCount);

    if (!readiness.isReady) {
      throw new BadRequestException({
        error: `Cannot mark event READY. Missing requirements: ${readiness.missingItems.join(', ')}`,
        missingItems: readiness.missingItems,
        readinessPercent: readiness.percent,
      });
    }

    const auditLogId = 'eolog_' + crypto.randomBytes(8).toString('hex');

    this.repository.markEventReady({
      id,
      actorUserId,
      actorName,
      auditLogId,
    });

    // Notify assigned Onsite Coordinator
    try {
      if (request.onsiteCoordinatorUserId) {
        this.notificationHelper.createNotification({
          recipientUserId: request.onsiteCoordinatorUserId,
          type: 'EVENT_READY',
          title: 'Event Ready for Operations',
          message: `"${request.eventName}" is fully prepared and ready for event-day operations.`,
          entityType: 'EVENT_REQUEST',
          entityId: id,
          deduplicate: true,
        });
      }
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch EVENT_READY notification',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'EVENT_MANAGER_SERVICE',
      );
    }

    return {
      message: `Event "${request.eventName}" has been successfully marked READY for event day!`,
      operationalStatus: 'READY',
      readinessPercent: 100,
    };
  }

  issueInvitation(id: string, dto: IssueInvitationDto, user: any) {
    const { recipientEmail, recipientName } = dto;
    const actorUserId = user.id;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      throw new BadRequestException(
        'Valid recipient email address is required.',
      );
    }

    const request = this.repository.findEventDetailsById(id);
    if (!request) {
      throw new NotFoundException('Event request not found.');
    }

    const invId = 'inv_' + crypto.randomBytes(8).toString('hex');
    const tokenStr = 'inv_tok_' + crypto.randomBytes(12).toString('hex');
    const inviteCodeStr = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    const createdInv = this.repository.createInvitation({
      invId,
      eventId: id,
      tokenStr,
      inviteCodeStr,
      recipientEmail: recipientEmail.trim().toLowerCase(),
      recipientName: recipientName || null,
      senderUserId: actorUserId,
      expiresAt,
    });

    return {
      message: `Private invitation issued successfully to ${recipientEmail}!`,
      invitation: createdInv,
    };
  }

  revokeInvitation(id: string) {
    const inv = this.repository.findInvitationById(id);
    if (!inv) {
      throw new NotFoundException('Invitation not found.');
    }

    this.repository.revokeInvitation(id);

    return {
      message: 'Invitation revoked successfully.',
      status: 'revoked',
    };
  }

  getSessions(eventId: string) {
    const sessions = this.repository.findSessionsByEventId(eventId);
    return { sessions };
  }

  createSession(eventId: string, dto: CreateSessionDto, user: any) {
    const { title, hall, startTime, endTime } = dto;

    if (!title || !title.trim()) {
      throw new BadRequestException('Session title is required.');
    }

    const sessionId = 'sess_' + crypto.randomBytes(8).toString('hex');

    const createdSession = this.repository.createSession({
      sessionId,
      eventId,
      speakerUserId: user.id,
      title: title.trim(),
      hall: hall || 'Main Hall',
      startTime: startTime || '10:00 AM',
      endTime: endTime || '11:00 AM',
    });

    return {
      message: 'Event session created successfully.',
      session: createdSession,
    };
  }
}
