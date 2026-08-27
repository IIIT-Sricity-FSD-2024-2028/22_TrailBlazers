import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { EventsRepository } from '../../repositories/events.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { NestLoggerService } from '../../common/logging/logger.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly repository: EventsRepository,
    private readonly notificationHelper: NotificationHelperService,
    private readonly logger: NestLoggerService,
  ) {}

  getEvents(filters: any) {
    const events = this.repository.findPublishedEvents(filters);
    return { events };
  }

  getEventById(id: string) {
    const event = this.repository.findEventById(id);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    return { event };
  }

  async submitQuestion(params: {
    eventId: string;
    questionText: string;
    sessionId?: string;
    user: any;
  }) {
    const { eventId, questionText, sessionId, user } = params;

    if (!questionText || !questionText.trim()) {
      throw new BadRequestException('Question text is required.');
    }

    const userId = user.id;
    const userName = user.name || 'Attendee';

    const ticket = this.repository.findTicketByUserAndEvent(userId, eventId);
    const isOwner = this.repository.findEventRequestByUserAndEvent(userId, eventId);

    if (!ticket && !isOwner) {
      throw new ForbiddenException(
        'Access denied. You must be registered for this event to submit questions.',
      );
    }

    const questionId = 'qa_' + crypto.randomBytes(8).toString('hex');
    this.repository.insertQuestion({
      id: questionId,
      eventId,
      sessionId,
      userId,
      userName,
      questionText,
    });

    // Notify Onsite Coordinator if assigned
    try {
      const eventReq = this.repository.findEventRequestById(eventId);
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
      this.logger.error(
        'Failed to dispatch NEW_QA_QUESTION notification',
        notifErr instanceof Error ? notifErr.stack : undefined,
        'EVENTS_SERVICE',
      );
    }

    return {
      message: 'Question submitted successfully and pending moderation.',
      questionId,
      status: 'PENDING',
    };
  }

  async upvoteQuestion(params: { questionId: string; user: any }) {
    const { questionId, user } = params;

    const question = this.repository.findQuestionById(questionId);
    if (!question) {
      throw new NotFoundException('Q&A question not found.');
    }

    const userId = user.id;
    const ticket = this.repository.findTicketByUserAndEvent(userId, question.eventId);
    const isOwner = this.repository.findEventRequestByUserAndEvent(userId, question.eventId);

    if (!ticket && !isOwner) {
      throw new ForbiddenException(
        'Access denied. You must be registered for this event to upvote questions.',
      );
    }

    const upvoteId = 'upv_' + crypto.randomBytes(8).toString('hex');
    try {
      const updated = this.repository.insertUpvote({
        id: upvoteId,
        questionId,
        userId,
      });
      return { message: 'Upvoted successfully.', upvoteCount: updated.upvoteCount };
    } catch (e: any) {
      if (e?.code === 'SQLITE_CONSTRAINT' || e?.message?.includes('UNIQUE')) {
        throw new BadRequestException('You have already upvoted this question.');
      }
      throw e;
    }
  }

  getActivePolls(eventId: string) {
    const polls = this.repository.findActivePollsByEventId(eventId);
    const enriched = polls.map((p) => {
      const options = this.repository.findPollOptionsByPollId(p.id);
      return {
        ...p,
        options,
      };
    });
    return { polls: enriched };
  }

  async respondToPoll(params: { pollId: string; optionId: string; user: any }) {
    const { pollId, optionId, user } = params;

    if (!optionId) {
      throw new BadRequestException('Option ID is required.');
    }

    const poll = this.repository.findPollById(pollId);
    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    if (poll.status !== 'LAUNCHED') {
      throw new BadRequestException(
        `Poll is not active for responses. Current status is '${poll.status}'.`,
      );
    }

    const validOption = this.repository.findPollOptionByIdAndPollId(optionId, pollId);
    if (!validOption) {
      throw new BadRequestException('Selected option does not belong to this poll.');
    }

    const userId = user.id;
    const ticket = this.repository.findTicketByUserAndEvent(userId, poll.eventId);
    const isOwner = this.repository.findEventRequestByUserAndEvent(userId, poll.eventId);

    if (!ticket && !isOwner) {
      throw new ForbiddenException(
        'Access denied. You must be registered for this event to respond to polls.',
      );
    }

    const responseId = 'presp_' + crypto.randomBytes(8).toString('hex');
    try {
      this.repository.insertPollResponse({
        id: responseId,
        pollId,
        optionId,
        userId,
      });
      return { message: 'Poll response submitted successfully.' };
    } catch (e: any) {
      if (e?.code === 'SQLITE_CONSTRAINT' || e?.message?.includes('UNIQUE')) {
        throw new BadRequestException(
          'You have already submitted a response for this poll.',
        );
      }
      throw e;
    }
  }

  async submitFeedback(params: {
    eventId: string;
    rating: number;
    comment?: string;
    user: any;
  }) {
    const { eventId, rating, comment, user } = params;
    const userId = user.id;
    const parsedRating = parseInt(rating as any, 10);

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new BadRequestException('Rating must be an integer between 1 and 5.');
    }

    const event = this.repository.findEventById(eventId);
    const eventReq = this.repository.findEventRequestById(eventId);

    if (!event && !eventReq) {
      throw new NotFoundException('Event not found.');
    }

    const isCompleted =
      (event && event.status === 'COMPLETED') ||
      (eventReq && eventReq.operationalStatus === 'COMPLETED') ||
      (event && event.status === 'PUBLISHED') ||
      (eventReq && eventReq.operationalStatus === 'READY');

    if (!isCompleted) {
      throw new BadRequestException('Feedback can only be submitted for completed events.');
    }

    const ticket = this.repository.findConfirmedTicketByUserAndEvent(userId, eventId);
    const isClient = eventReq && eventReq.userId === userId;

    if (!ticket && !isClient) {
      throw new ForbiddenException(
        'Access denied. Only registered attendees of this event can submit feedback.',
      );
    }

    const existingFeedback = this.repository.findFeedbackByEventAndUser(eventId, userId);
    if (existingFeedback) {
      throw new BadRequestException('You have already submitted feedback for this event.');
    }

    const feedbackId = 'efb_' + crypto.randomBytes(8).toString('hex');
    this.repository.insertFeedback({
      id: feedbackId,
      eventId,
      userId,
      rating: parsedRating,
      comment,
    });

    return {
      message: 'Thank you! Your feedback has been submitted successfully.',
      feedbackId,
    };
  }
}
