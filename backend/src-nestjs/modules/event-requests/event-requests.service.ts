import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { EventRequestsRepository } from '../../repositories/event-requests.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { NestLoggerService } from '../../common/logging/logger.service';
import { CreateEventRequestDto } from './dto/create-event-request.dto';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class EventRequestsService {
  constructor(
    private readonly repository: EventRequestsRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly logger: NestLoggerService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async createEventRequest(dto: CreateEventRequestDto, userId: string) {
    const {
      organizationName,
      contactEmail,
      eventName,
      category,
      venue,
      location,
    } = dto;

    const startDate = (dto.startDate || dto.eventDate || '').trim();
    const endDate = (dto.endDate || (!dto.startDate && dto.eventDate ? dto.eventDate : '')).trim();

    if (
      !organizationName ||
      !contactEmail ||
      !eventName ||
      !category ||
      !startDate ||
      !endDate ||
      !venue ||
      !location
    ) {
      throw new BadRequestException(
        'Please complete all required fields (Organization, Contact Email, Event Name, Category, Start Date, End Date, Venue, Location).',
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new BadRequestException(
        'Start Date and End Date must be valid dates in YYYY-MM-DD format.',
      );
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'Start Date must not be later than End Date (End Date must not be earlier than Start Date).',
      );
    }

    const id = 'req_' + crypto.randomBytes(8).toString('hex');
    const requestId = 'REQ-2026-' + Math.floor(10000 + Math.random() * 90000);
    const status = 'UNDER_REVIEW';

    const createdRequest = this.repository.createRequest({
      id,
      requestId,
      userId,
      organizationName: dto.organizationName,
      contactEmail: dto.contactEmail,
      eventName: dto.eventName,
      description: dto.description,
      agenda: dto.agenda,
      category: dto.category,
      startDate,
      endDate,
      eventDate: startDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      venue: dto.venue,
      location: dto.location,
      eventType: dto.eventType,
      expectedAttendance: dto.expectedAttendance,
      isPaid: dto.isPaid,
      ticketPrice: dto.ticketPrice,
      frequency: dto.frequency,
      recurringPerWeek: dto.recurringPerWeek,
      additionalNotes: dto.additionalNotes,
      bannerUrl: dto.bannerUrl,
      status,
    });

    // Notify Revenue Team users
    try {
      const revenueUsers = this.repository.findRevenueUsers();
      for (const revUser of revenueUsers) {
        this.notificationHelper.createNotification({
          recipientUserId: revUser.id,
          type: 'NEW_EVENT_REQUEST',
          title: 'New Event Request',
          message: `"${createdRequest.organizationName} / ${createdRequest.eventName}" has submitted a new event request for review.`,
          entityType: 'EVENT_REQUEST',
          entityId: id,
          deduplicate: true,
        });
      }
    } catch (notifErr) {
      this.logger.error(
        'Failed to dispatch NEW_EVENT_REQUEST notification',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'EVENT_REQUESTS_SERVICE',
      );
    }

    return {
      message: 'Your event creation request has been submitted successfully!',
      request: createdRequest,
    };
  }

  async getMyEventRequests(userId: string) {
    const requests = this.repository.findRequestsByUserId(userId);
    return { requests };
  }

  async getEventStats(eventId: string, user: any) {
    if (!eventId) {
      throw new BadRequestException('Event ID is required.');
    }

    let eventReq = this.repository.findRequestById(eventId);
    if (!eventReq) {
      const evt = this.repository.findEventById(eventId);
      if (evt) {
        eventReq = this.repository.findRequestById(evt.id) || evt;
      }
    }

    if (!eventReq) {
      throw new NotFoundException(`Event with ID ${eventId} not found.`);
    }

    // Client Authorization and Data Isolation:
    // A client must only be able to view statistics for events that belong to that client
    const userRole = (user?.role || '').toUpperCase();
    const isOwner = eventReq.userId === user?.id || (eventReq as any).organizerUserId === user?.id;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isAssignedManager = eventReq.eventManagerUserId === user?.id;

    if (!isOwner && !isAdmin && !isAssignedManager) {
      throw new ForbiddenException(
        'Access denied. You are not authorized to view statistics for this event.',
      );
    }

    const stats = this.repository.calculateEventStats(eventId);

    return {
      eventId,
      ticketsSold: stats.ticketsSold,
      attendeeCheckIns: stats.attendeeCheckIns,
    };
  }

  async exportEventAnalytics(eventId: string, user: any) {
    return this.analyticsService.getEventAnalyticsPdfReport(eventId, user);
  }

  async getEventReportStatus(eventId: string, user: any) {
    return this.analyticsService.getEventReportStatus(eventId, user);
  }
}
