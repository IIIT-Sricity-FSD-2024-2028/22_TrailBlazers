import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ChangeRequestsRepository } from '../../repositories/change-requests.repository';
import { SubmitChangeRequestDto } from './dto/submit-change-request.dto';
import { ReviewChangeRequestDto } from './dto/review-change-request.dto';
import { NotificationHelperService } from '../notifications/notification-helper.service';

@Injectable()
export class ChangeRequestsService {
  constructor(
    private readonly changeRequestsRepo: ChangeRequestsRepository,
    private readonly notificationHelper: NotificationHelperService,
  ) {}

  submitChangeRequest(dto: SubmitChangeRequestDto, user: any) {
    if (!dto.eventRequestId || !dto.requestedChange || !dto.requestedChange.trim()) {
      throw new BadRequestException(
        'Event Request ID and requested change details are required.',
      );
    }

    const eventReq = this.changeRequestsRepo.findEventRequestById(dto.eventRequestId);
    if (!eventReq) {
      throw new NotFoundException('Event request not found.');
    }

    const mgrId = eventReq.assignedManagerUserId || eventReq.eventManagerUserId;
    if (eventReq.userId !== user.id && mgrId !== user.id) {
      throw new ForbiddenException(
        'Access denied. You can only submit change requests for your own events.',
      );
    }

    const id = 'ecr_' + crypto.randomBytes(8).toString('hex');
    const created = this.changeRequestsRepo.createChangeRequest({
      id,
      eventRequestId: dto.eventRequestId,
      eventId: eventReq.id,
      clientUserId: user.id,
      clientName: user.name,
      eventManagerUserId: eventReq.eventManagerUserId,
      changeType: dto.changeType || 'Agenda Change',
      currentDetails: dto.currentDetails || eventReq.agenda || '',
      requestedChange: dto.requestedChange.trim(),
      reason: dto.reason ? dto.reason.trim() : null,
    });

    try {
      if (eventReq.eventManagerUserId) {
        this.notificationHelper.createNotification({
          recipientUserId: eventReq.eventManagerUserId,
          type: 'CLIENT_CHANGE_REQUEST',
          title: 'Client Change Request',
          message: `${user.name} requested a change for "${eventReq.eventName}".`,
          entityType: 'EVENT_CHANGE_REQUEST',
          entityId: id,
          senderUserId: user.id,
          senderName: user.name,
          senderRole: 'Client',
          eventName: eventReq.eventName,
          deduplicate: true,
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch CLIENT_CHANGE_REQUEST notification:', notifErr);
    }

    return {
      message: 'Your change request has been submitted to the Event Manager for review.',
      changeRequest: created,
    };
  }

  getClientChangeRequests(userId: string) {
    const changeRequests = this.changeRequestsRepo.getChangeRequestsByClient(userId);
    return { changeRequests };
  }

  getManagerPendingChangeRequests(managerUserId: string) {
    const changeRequests = this.changeRequestsRepo.getPendingChangeRequestsForManager(managerUserId);
    return { changeRequests };
  }

  reviewChangeRequest(changeRequestId: string, dto: ReviewChangeRequestDto, user: any) {
    if (!changeRequestId || !dto.action) {
      throw new BadRequestException(
        'Change Request ID and action (APPROVE/REJECT) are required.',
      );
    }

    const cr = this.changeRequestsRepo.getChangeRequestById(changeRequestId);
    if (!cr) {
      throw new NotFoundException('Change request record not found.');
    }

    if (cr.status !== 'PENDING') {
      throw new BadRequestException(
        `Change request is already ${cr.status.toLowerCase()}.`,
      );
    }

    const eventReq = this.changeRequestsRepo.findEventRequestById(cr.eventRequestId);
    if (!eventReq) {
      throw new NotFoundException('Associated event request not found.');
    }

    const upperAction = dto.action.toUpperCase();
    if (
      upperAction !== 'APPROVE' &&
      upperAction !== 'REJECT' &&
      upperAction !== 'QUOTATION_REVISION_REQUIRED'
    ) {
      throw new BadRequestException(
        "Invalid review action. Must be 'APPROVE', 'REJECT', or 'QUOTATION_REVISION_REQUIRED'.",
      );
    }

    const managerName = user.name || 'Event Manager';

    if (upperAction === 'QUOTATION_REVISION_REQUIRED') {
      const updatedCR = this.changeRequestsRepo.updateChangeRequestStatus({
        id: changeRequestId,
        status: 'QUOTATION_REVISION_REQUIRED',
        reviewComment: dto.reviewComment || 'Quotation revision required for commercial/financial impact.',
        reviewedByUserId: user.id,
      });

      try {
        const revenueUsers = this.changeRequestsRepo.findUsersByRole('REVENUE');
        for (const revUser of revenueUsers) {
          this.notificationHelper.createNotification({
            recipientUserId: revUser.id,
            type: 'QUOTATION_REVISION_NEEDED',
            title: 'Quotation Revision Needed',
            message: `Event Manager flagged a commercial change request for "${eventReq.eventName}" requiring quotation revision.`,
            entityType: 'EVENT_CHANGE_REQUEST',
            entityId: changeRequestId,
            senderUserId: user.id,
            senderName: managerName,
            senderRole: 'Event Manager',
            eventName: eventReq.eventName,
            deduplicate: true,
          });
        }

        this.notificationHelper.createNotification({
          recipientUserId: cr.clientUserId,
          type: 'CHANGE_REQUEST_QUOTATION_REQUIRED',
          title: 'Commercial Review Needed',
          message: `Your change request for "${eventReq.eventName}" requires a commercial quotation adjustment by the Revenue Team.`,
          entityType: 'EVENT_CHANGE_REQUEST',
          entityId: changeRequestId,
          senderUserId: user.id,
          senderName: managerName,
          senderRole: 'Event Manager',
          eventName: eventReq.eventName,
          deduplicate: true,
        });
      } catch (notifErr) {
        console.error('Failed to dispatch QUOTATION_REVISION_NEEDED notification:', notifErr);
      }

      return {
        message: 'Change request flagged for quotation revision by Revenue Team.',
        changeRequest: updatedCR,
      };
    }

    if (upperAction === 'APPROVE') {
      const updatedCR = this.changeRequestsRepo.updateChangeRequestStatus({
        id: changeRequestId,
        status: 'APPROVED',
        reviewComment: dto.reviewComment,
        reviewedByUserId: user.id,
      });

      this.changeRequestsRepo.updateEventRequestData(cr.eventRequestId, {
        agenda: cr.requestedChange,
      });

      try {
        this.notificationHelper.createNotification({
          recipientUserId: cr.clientUserId,
          type: 'CHANGE_REQUEST_APPROVED',
          title: 'Change Request Approved',
          message: `${managerName} (Event Manager) approved your change request for "${eventReq.eventName}".`,
          entityType: 'EVENT_CHANGE_REQUEST',
          entityId: changeRequestId,
          senderUserId: user.id,
          senderName: managerName,
          senderRole: 'Event Manager',
          eventName: eventReq.eventName,
          deduplicate: true,
        });
      } catch (notifErr) {
        console.error('Failed to dispatch CHANGE_REQUEST_APPROVED notification:', notifErr);
      }

      return {
        message: 'Change request approved and event plan updated successfully!',
        changeRequest: updatedCR,
      };
    } else {
      const updatedCR = this.changeRequestsRepo.updateChangeRequestStatus({
        id: changeRequestId,
        status: 'REJECTED',
        reviewComment: dto.reviewComment,
        reviewedByUserId: user.id,
      });

      try {
        this.notificationHelper.createNotification({
          recipientUserId: cr.clientUserId,
          type: 'CHANGE_REQUEST_REJECTED',
          title: 'Change Request Rejected',
          message: `${managerName} (Event Manager) rejected your change request for "${eventReq.eventName}". ${dto.reviewComment ? 'Reason: ' + dto.reviewComment : ''}`,
          entityType: 'EVENT_CHANGE_REQUEST',
          entityId: changeRequestId,
          senderUserId: user.id,
          senderName: managerName,
          senderRole: 'Event Manager',
          eventName: eventReq.eventName,
          deduplicate: true,
        });
      } catch (notifErr) {
        console.error('Failed to dispatch CHANGE_REQUEST_REJECTED notification:', notifErr);
      }

      return {
        message: 'Change request rejected.',
        changeRequest: updatedCR,
      };
    }
  }
}
