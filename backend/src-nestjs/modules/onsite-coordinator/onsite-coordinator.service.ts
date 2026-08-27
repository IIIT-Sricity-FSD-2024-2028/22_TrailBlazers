import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { OnsiteCoordinatorRepository } from '../../repositories/onsite-coordinator.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { NestLoggerService } from '../../common/logging/logger.service';
import { CheckInDto } from './dto/check-in.dto';
import { UpdateOperationalStatusDto } from './dto/update-operational-status.dto';
import { ReportIssueDto } from './dto/report-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';

@Injectable()
export class OnsiteCoordinatorService {
  constructor(
    private readonly repository: OnsiteCoordinatorRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly logger: NestLoggerService,
  ) {}

  assertEventAssignedToCoordinator(eventId: string, coordinatorUserId: string) {
    const eventReq = this.repository.findEventAssignment(eventId);
    if (!eventReq) {
      throw new NotFoundException('Assigned event not found.');
    }
    if (eventReq.onsiteCoordinatorUserId !== coordinatorUserId) {
      throw new ForbiddenException(
        'Access denied. You are only authorized to access events assigned to your coordinator account.',
      );
    }
    return eventReq;
  }

  getDashboard(user: any) {
    const coordinatorUserId = user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const metricsData = this.repository.getDashboardMetrics(
      coordinatorUserId,
      todayStr,
    );

    const myEvents = this.repository.findAssignedEvents(coordinatorUserId);

    const enrichedEvents = myEvents.map((evt: any) => {
      const stats = this.repository.getEventStats(evt.id);
      return {
        ...evt,
        registered: stats.registered,
        checkedIn: stats.checkedIn,
        attendancePercent: stats.attendancePercent,
      };
    });

    const upcomingEvent = enrichedEvents[0] || null;

    return {
      metrics: {
        todaysEvents: metricsData.todaysEvents,
        assignedEvents: metricsData.assignedEvents,
        checkedInAttendees: metricsData.checkedInAttendees,
        upcomingEventName: upcomingEvent ? upcomingEvent.eventName : 'None',
      },
      events: enrichedEvents,
      upcomingEvent,
    };
  }

  getEvents(user: any, search?: string, filter?: string) {
    const coordinatorUserId = user.id;
    const events = this.repository.findAssignedEventsFiltered(
      coordinatorUserId,
      search,
      filter,
    );

    const enriched = events.map((evt: any) => {
      const stats = this.repository.getEventStats(evt.id);
      return {
        ...evt,
        registered: stats.registered,
        checkedIn: stats.checkedIn,
        attendancePercent: stats.attendancePercent,
      };
    });

    return { events: enriched };
  }

  getEventWorkspace(id: string, user: any) {
    const coordinatorUserId = user.id;
    this.assertEventAssignedToCoordinator(id, coordinatorUserId);

    const event = this.repository.findWorkspaceEvent(id);
    if (!event) {
      throw new NotFoundException('Assigned event not found.');
    }

    const stats = this.repository.getEventStats(id);
    const recentCheckIns = this.repository.findRecentCheckIns(id, 10);

    return {
      event,
      stats,
      recentCheckIns,
    };
  }

  checkInAttendee(id: string, dto: CheckInDto, user: any) {
    const coordinatorUserId = user.id;
    const coordinatorName = user.name || 'Onsite Coordinator';

    // Verify Event Assignment
    const eventAssignment = this.repository.findEventAssignment(id);
    if (!eventAssignment) {
      throw new NotFoundException('Assigned event not found.');
    }
    if (eventAssignment.onsiteCoordinatorUserId !== coordinatorUserId) {
      throw new ForbiddenException(
        'Access denied. You are only authorized to check in attendees for events assigned to you.',
      );
    }

    const ticketNumber = dto.ticketNumber;
    const ticketId = dto.ticketId;

    if (!ticketNumber && !ticketId) {
      throw new BadRequestException(
        'Ticket number or Ticket ID is required.',
      );
    }

    const searchTerm = (ticketNumber || ticketId || '').trim();

    // Query ticket
    const ticket = this.repository.findTicketByNumberOrId(searchTerm);
    if (!ticket) {
      throw new NotFoundException(
        `Invalid ticket. Ticket "${searchTerm}" was not found.`,
      );
    }

    // Verify ticket belongs to THIS event
    if (ticket.eventId !== id) {
      throw new BadRequestException(
        `Ticket Mismatch. Ticket "${ticket.ticketNumber}" is registered for a different event.`,
      );
    }

    // Duplicate Check-In Protection
    if (ticket.checkedIn === 1) {
      throw new BadRequestException({
        error: '⚠ ALREADY CHECKED IN',
        isDuplicate: true,
        alreadyCheckedIn: true,
        checkedInAt: ticket.checkedInAt,
        attendeeName: ticket.attendeeName,
        ticketNumber: ticket.ticketNumber,
      });
    }

    const nowStr = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
    const auditLogId = 'eolog_' + crypto.randomBytes(8).toString('hex');

    // Execute atomic transaction
    this.repository.executeCheckInTransaction({
      ticketId: ticket.id,
      nowStr,
      coordinatorUserId,
      coordinatorName,
      eventRequestId: id,
      attendeeName: ticket.attendeeName,
      ticketNumber: ticket.ticketNumber,
      auditLogId,
    });

    return {
      message: '✓ CHECK-IN SUCCESSFUL',
      attendeeName: ticket.attendeeName,
      ticketNumber: ticket.ticketNumber,
      checkedInAt: nowStr,
    };
  }

  getAttendees(id: string, user: any, search?: string) {
    const coordinatorUserId = user.id;

    const eventAssignment = this.repository.findEventAssignment(id);
    if (!eventAssignment) {
      throw new NotFoundException('Assigned event not found.');
    }
    if (eventAssignment.onsiteCoordinatorUserId !== coordinatorUserId) {
      throw new ForbiddenException(
        'Access denied. You are only authorized to view attendees for events assigned to you.',
      );
    }

    const attendees = this.repository.findAttendees(id, search);
    return { attendees };
  }

  updateOperationalStatus(
    id: string,
    dto: UpdateOperationalStatusDto,
    user: any,
  ) {
    const coordinatorUserId = user.id;
    const coordinatorName = user.name || 'Onsite Coordinator';
    const { operationalStatus } = dto;

    const eventAssignment = this.repository.findEventAssignment(id);
    if (!eventAssignment) {
      throw new NotFoundException('Assigned event not found.');
    }
    if (eventAssignment.onsiteCoordinatorUserId !== coordinatorUserId) {
      throw new ForbiddenException(
        'Access denied. You can only manage operational status for assigned events.',
      );
    }

    const validStatuses = ['CHECK_IN_OPEN', 'LIVE', 'COMPLETED'];
    if (!validStatuses.includes(operationalStatus)) {
      throw new BadRequestException(
        `Invalid operational status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const auditLogId = 'eolog_' + crypto.randomBytes(8).toString('hex');

    // Execute database update and audit log in transaction
    this.repository.updateEventOperationalStatus(
      id,
      operationalStatus,
      coordinatorUserId,
      coordinatorName,
      auditLogId,
    );

    // Dispatch notifications
    try {
      const eventReq = this.repository.findEventRequestById(id);
      const eventName = eventReq ? eventReq.eventName : 'Event';

      if (operationalStatus === 'LIVE') {
        if (eventReq && eventReq.eventManagerUserId) {
          this.notificationHelper.createNotification({
            recipientUserId: eventReq.eventManagerUserId,
            type: 'EVENT_LIVE',
            title: 'Event is Live',
            message: `"${eventName}" is now live.`,
            entityType: 'EVENT_REQUEST',
            entityId: id,
            deduplicate: true,
          });
        }

        const sessionSpeakers = this.repository.findSessionSpeakers(id);
        for (const sess of sessionSpeakers) {
          if (sess.speakerUserId) {
            this.notificationHelper.createNotification({
              recipientUserId: sess.speakerUserId,
              type: 'EVENT_LIVE',
              title: 'Session / Event is Live',
              message: `"${eventName}" is now live.`,
              entityType: 'EVENT_REQUEST',
              entityId: id,
              deduplicate: true,
            });
          }
        }
      } else if (operationalStatus === 'COMPLETED') {
        if (eventReq && eventReq.eventManagerUserId) {
          this.notificationHelper.createNotification({
            recipientUserId: eventReq.eventManagerUserId,
            type: 'EVENT_COMPLETED',
            title: 'Event Completed',
            message: `"${eventName}" has completed successfully.`,
            entityType: 'EVENT_REQUEST',
            entityId: id,
            deduplicate: true,
          });
        }

        if (eventReq && eventReq.userId) {
          this.notificationHelper.createNotification({
            recipientUserId: eventReq.userId,
            type: 'EVENT_COMPLETED',
            title: 'Event Completed',
            message: `Your event "${eventName}" has completed. Post-event insights will become available after analytics are processed.`,
            entityType: 'EVENT_REQUEST',
            entityId: id,
            deduplicate: true,
          });
        }
      }
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch status transition notification:',
        notifErr,
      );
    }

    return {
      message: `Event operational status updated to ${operationalStatus}`,
      operationalStatus,
    };
  }

  getIssues(id: string, user: any) {
    const coordinatorUserId = user.id;

    const eventAssignment = this.repository.findEventAssignment(id);
    if (!eventAssignment) {
      throw new NotFoundException('Assigned event not found.');
    }
    if (eventAssignment.onsiteCoordinatorUserId !== coordinatorUserId) {
      throw new ForbiddenException(
        'Access denied. You can only view issues for your assigned events.',
      );
    }

    const issues = this.repository.findIssuesByEventId(id);
    return { issues };
  }

  reportIssue(id: string, dto: ReportIssueDto, user: any) {
    const coordinatorUserId = user.id;
    const coordinatorName = user.name || 'Onsite Coordinator';
    const category = dto.category || 'Technical';
    const priority = dto.priority || 'Medium';
    const description = dto.description;

    const eventAssignment = this.repository.findEventAssignment(id);
    if (!eventAssignment) {
      throw new NotFoundException('Assigned event not found.');
    }
    if (eventAssignment.onsiteCoordinatorUserId !== coordinatorUserId) {
      throw new ForbiddenException(
        'Access denied. You can only report issues for your assigned events.',
      );
    }

    if (!description || !description.trim()) {
      throw new BadRequestException('Issue description is required.');
    }

    const issueId = 'issue_' + crypto.randomBytes(8).toString('hex');
    const auditLogId = 'eolog_' + crypto.randomBytes(8).toString('hex');

    this.repository.createOperationalIssue({
      issueId,
      eventId: id,
      reporterUserId: coordinatorUserId,
      reporterName: coordinatorName,
      category,
      priority,
      description: description.trim(),
      auditLogId,
    });

    // Notify assigned Event Manager
    try {
      const eventReq = this.repository.findEventRequestById(id);
      if (eventReq && eventReq.eventManagerUserId) {
        this.notificationHelper.createNotification({
          recipientUserId: eventReq.eventManagerUserId,
          type: 'OPERATIONAL_ISSUE',
          title: 'Operational Issue Reported',
          message: `"${category}" issue reported for "${eventReq.eventName}".`,
          entityType: 'OPERATIONAL_ISSUE',
          entityId: issueId,
          deduplicate: true,
        });
      }
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch OPERATIONAL_ISSUE notification:',
        notifErr,
      );
    }

    return {
      message: 'Operational issue reported successfully.',
      issueId,
    };
  }

  updateIssueStatus(id: string, dto: UpdateIssueStatusDto, user: any) {
    const coordinatorUserId = user.id;
    const { status, resolutionDetails } = dto;

    const issue = this.repository.findIssueByIdWithCoordinator(id);
    if (!issue) {
      throw new NotFoundException('Operational issue not found.');
    }

    if (issue.onsiteCoordinatorUserId !== coordinatorUserId) {
      throw new ForbiddenException(
        'Access denied. You can only manage issues belonging to events assigned to you.',
      );
    }

    this.repository.updateIssueStatus(
      id,
      status,
      resolutionDetails || null,
      coordinatorUserId,
    );

    return {
      message: 'Issue status updated successfully.',
      status,
    };
  }
}
