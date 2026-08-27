import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { SubmitQuestionDto } from './dto/submit-question.dto';
import { QaRepository } from '../../repositories/qa.repository';

@Injectable()
export class QaService {
  constructor(
    private readonly qaRepository: QaRepository,
    private readonly notificationHelper: NotificationHelperService,
  ) {}

  submitQuestion(eventId: string, dto: SubmitQuestionDto, user: any) {
    if (!dto.questionText || !dto.questionText.trim()) {
      throw new BadRequestException('Question text is required.');
    }

    const userId = user.id;
    const userName = user.name || 'Attendee';

    // Verify attendee registration or event ownership
    const ticket = this.qaRepository.findTicketByUserAndEvent(userId, eventId);
    const isOwner = this.qaRepository.findEventRequestByUserAndEvent(userId, eventId);

    if (!ticket && !isOwner) {
      throw new ForbiddenException('Access denied. You must be registered for this event to submit questions.');
    }

    const questionId = 'qa_' + crypto.randomBytes(8).toString('hex');
    this.qaRepository.insertQuestion({
      id: questionId,
      eventId,
      sessionId: dto.sessionId,
      userId,
      userName,
      questionText: dto.questionText,
    });

    // Notify Onsite Coordinator if assigned
    try {
      const eventReq = this.qaRepository.findEventRequestById(eventId);
      if (eventReq && eventReq.onsiteCoordinatorUserId) {
        this.notificationHelper.createNotification({
          recipientUserId: eventReq.onsiteCoordinatorUserId,
          type: 'NEW_QA_QUESTION',
          title: 'New Question Pending',
          message: 'A new attendee question is waiting for moderation.',
          entityType: 'QA_QUESTION',
          entityId: questionId,
          deduplicate: true,
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch NEW_QA_QUESTION notification:', notifErr);
    }

    return {
      message: 'Question submitted successfully and pending moderation.',
      questionId,
      status: 'PENDING',
    };
  }

  upvoteQuestion(questionId: string, user: any) {
    const question = this.qaRepository.findQuestionById(questionId);
    if (!question) {
      throw new NotFoundException('Q&A question not found.');
    }

    const userId = user.id;

    // Verify attendee registration or event ownership
    const ticket = this.qaRepository.findTicketByUserAndEvent(userId, question.eventId);
    const isOwner = this.qaRepository.findEventRequestByUserAndEvent(userId, question.eventId);

    if (!ticket && !isOwner) {
      throw new ForbiddenException('Access denied. You must be registered for this event to upvote questions.');
    }

    const upvoteId = 'upv_' + crypto.randomBytes(8).toString('hex');

    try {
      const updated = this.qaRepository.insertUpvoteAtomic(upvoteId, questionId, userId);
      return {
        message: 'Upvoted successfully.',
        upvoteCount: updated.upvoteCount,
      };
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT' || (e.message && e.message.includes('UNIQUE'))) {
        throw new BadRequestException('You have already upvoted this question.');
      }
      throw e;
    }
  }
}
