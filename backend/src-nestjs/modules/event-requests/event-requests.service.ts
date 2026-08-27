import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { EventRequestsRepository } from '../../repositories/event-requests.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { NestLoggerService } from '../../common/logging/logger.service';
import { CreateEventRequestDto } from './dto/create-event-request.dto';

@Injectable()
export class EventRequestsService {
  constructor(
    private readonly repository: EventRequestsRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly logger: NestLoggerService,
  ) {}

  async createEventRequest(dto: CreateEventRequestDto, userId: string) {
    const {
      organizationName,
      contactEmail,
      eventName,
      category,
      eventDate,
      venue,
      location,
    } = dto;

    if (
      !organizationName ||
      !contactEmail ||
      !eventName ||
      !category ||
      !eventDate ||
      !venue ||
      !location
    ) {
      throw new BadRequestException(
        'Please complete all required fields (Organization, Contact Email, Event Name, Category, Date, Venue, Location).',
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
      eventDate: dto.eventDate,
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
}
