import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { FeedbackRepository } from '../../repositories/feedback.repository';
import { SubmitEventFeedbackDto } from './dto/submit-event-feedback.dto';
import { CreateFeedbackPollDto } from './dto/create-feedback-poll.dto';
import { RespondToFeedbackPollDto } from './dto/respond-to-feedback-poll.dto';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepo: FeedbackRepository,
  ) {}

  // Core Event Feedback Method
  submitEventFeedback(eventId: string, dto: SubmitEventFeedbackDto, user: any) {
    const userId = user.id;
    const parsedRating = parseInt(dto.rating as any, 10);

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new BadRequestException('Rating must be an integer between 1 and 5.');
    }

    const event = this.feedbackRepo.findEventById(eventId);
    const eventReq = this.feedbackRepo.findEventRequestById(eventId);

    if (!event && !eventReq) {
      throw new NotFoundException('Event not found.');
    }

    const isCompleted =
      (event && event.status === 'COMPLETED') ||
      (eventReq && eventReq.operationalStatus === 'COMPLETED') ||
      (event && event.status === 'PUBLISHED') ||
      (eventReq && eventReq.operationalStatus === 'READY');

    if (!isCompleted) {
      throw new BadRequestException(
        'Feedback can only be submitted for completed events.',
      );
    }

    const ticket = this.feedbackRepo.findConfirmedTicketByUserAndEvent(userId, eventId);
    const isClient = eventReq && eventReq.userId === userId;

    if (!ticket && !isClient) {
      throw new ForbiddenException(
        'Access denied. Only registered attendees of this event can submit feedback.',
      );
    }

    const existingFeedback = this.feedbackRepo.findFeedbackByEventAndUser(
      eventId,
      userId,
    );
    if (existingFeedback) {
      throw new BadRequestException(
        'You have already submitted feedback for this event.',
      );
    }

    const feedbackId = 'efb_' + crypto.randomBytes(8).toString('hex');

    try {
      this.feedbackRepo.insertFeedback({
        id: feedbackId,
        eventId,
        userId,
        rating: parsedRating,
        comment: dto.comment,
      });

      return {
        message: 'Thank you! Your feedback has been submitted successfully.',
        feedbackId,
      };
    } catch (e: any) {
      if (
        e.code === 'SQLITE_CONSTRAINT' ||
        (e.message && e.message.includes('UNIQUE'))
      ) {
        throw new BadRequestException(
          'You have already submitted feedback for this event.',
        );
      }
      throw e;
    }
  }

  // Feedback Survey Polls Methods
  createPoll(dto: CreateFeedbackPollDto, user: any) {
    const { eventId, title, description, questions, status } = dto;

    if (!eventId || !title || !title.trim()) {
      throw new BadRequestException('Event ID and poll title are required.');
    }

    const role = (user.role || '').toUpperCase();
    if (
      role !== 'EVENT_MANAGER' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'DEPARTMENT_MANAGER'
    ) {
      throw new ForbiddenException(
        'Unauthorized: Only Event Managers can create feedback polls.',
      );
    }

    const pollId = `poll_${crypto.randomUUID()}`;
    const initialStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const publishedAt =
      initialStatus === 'PUBLISHED' ? new Date().toISOString() : null;

    (() => {
      this.feedbackRepo.insertFeedbackPoll({
        id: pollId,
        eventId,
        createdByUserId: user.id,
        title: title.trim(),
        description: description ? description.trim() : '',
        status: initialStatus,
        publishedAt,
      });

      if (Array.isArray(questions) && questions.length > 0) {
        questions.forEach((q, idx) => {
          const qId = `q_${crypto.randomUUID()}`;
          const optionsJson = Array.isArray(q.options)
            ? JSON.stringify(q.options)
            : q.options || null;
          this.feedbackRepo.insertFeedbackQuestion({
            id: qId,
            pollId,
            questionText: q.questionText.trim(),
            questionType: q.questionType || 'RATING',
            options: optionsJson,
            displayOrder: idx + 1,
          });
        });
      }
    })();

    const poll = this.feedbackRepo.findFeedbackPollById(pollId);
    return {
      success: true,
      poll,
      message: `Feedback poll created successfully as ${initialStatus}.`,
    };
  }

  getPollsByEvent(eventId: string, user: any) {
    const role = (user.role || '').toUpperCase();
    const isManager =
      role === 'EVENT_MANAGER' ||
      role === 'SUPER_ADMIN' ||
      role === 'DEPARTMENT_MANAGER';

    const polls = this.feedbackRepo.findFeedbackPollsByEventId(eventId, isManager);

    const enrichedPolls = polls.map((p) => {
      const questions = this.feedbackRepo.findFeedbackQuestionsByPollId(p.id);
      const formattedQuestions = questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : [],
      }));

      const responseCount = this.feedbackRepo.countResponsesByPollId(p.id);
      const totalAttendees = Math.max(
        this.feedbackRepo.countTicketsByEventId(p.eventId),
        1,
      );
      const responseRate = Number(
        ((responseCount / totalAttendees) * 100).toFixed(1),
      );

      const existingResponse = this.feedbackRepo.findExistingResponse(
        p.id,
        user.id,
      );

      return {
        ...p,
        questions: formattedQuestions,
        responseCount,
        totalAttendees,
        responseRate,
        hasSubmitted: Boolean(existingResponse),
      };
    });

    return { polls: enrichedPolls };
  }

  getAttendeePolls(user: any) {
    const polls = this.feedbackRepo.findAttendeePolls(user.id);

    const enrichedPolls = polls.map((p) => {
      const questions = this.feedbackRepo.findFeedbackQuestionsByPollId(p.id);
      const formattedQuestions = questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : [],
      }));

      const existingResponse = this.feedbackRepo.findExistingResponse(
        p.id,
        user.id,
      );

      return {
        ...p,
        questions: formattedQuestions,
        hasSubmitted: Boolean(existingResponse),
      };
    });

    return { polls: enrichedPolls };
  }

  getPollDetails(pollId: string, user: any) {
    const poll = this.feedbackRepo.findFeedbackPollById(pollId);
    if (!poll) {
      throw new NotFoundException('Feedback poll not found.');
    }

    const questions = this.feedbackRepo.findFeedbackQuestionsByPollId(pollId);
    const formattedQuestions = questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : [],
    }));

    const existingResponse = this.feedbackRepo.findExistingResponse(
      pollId,
      user.id,
    );

    return {
      poll: {
        ...poll,
        questions: formattedQuestions,
        hasSubmitted: Boolean(existingResponse),
      },
    };
  }

  publishPoll(pollId: string, user: any) {
    const role = (user.role || '').toUpperCase();
    if (
      role !== 'EVENT_MANAGER' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'DEPARTMENT_MANAGER'
    ) {
      throw new ForbiddenException('Unauthorized.');
    }

    const poll = this.feedbackRepo.findFeedbackPollById(pollId);
    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    const ticketCount = this.feedbackRepo.countTicketsByEventId(poll.eventId);
    if (ticketCount === 0) {
      throw new BadRequestException(
        'Cannot publish poll: No registered attendees exist for this event yet.',
      );
    }

    this.feedbackRepo.updatePollStatusToPublished(pollId);
    const updated = this.feedbackRepo.findFeedbackPollById(pollId);

    return {
      success: true,
      poll: updated,
      message: 'Poll published! Registered attendees can now submit feedback.',
    };
  }

  closePoll(pollId: string, user: any) {
    const role = (user.role || '').toUpperCase();
    if (
      role !== 'EVENT_MANAGER' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'DEPARTMENT_MANAGER'
    ) {
      throw new ForbiddenException('Unauthorized.');
    }

    const changes = this.feedbackRepo.updatePollStatusToClosed(pollId);
    if (changes === 0) {
      throw new NotFoundException('Poll not found.');
    }

    const updated = this.feedbackRepo.findFeedbackPollById(pollId);
    return {
      success: true,
      poll: updated,
      message: 'Poll closed. No further responses accepted.',
    };
  }

  deletePoll(pollId: string, user: any) {
    const role = (user.role || '').toUpperCase();
    if (
      role !== 'EVENT_MANAGER' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'DEPARTMENT_MANAGER'
    ) {
      throw new ForbiddenException('Unauthorized.');
    }

    const poll = this.feedbackRepo.findFeedbackPollById(pollId);
    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    this.feedbackRepo.deletePoll(pollId);
    return { success: true, message: 'Poll deleted successfully.' };
  }

  respondToPoll(pollId: string, dto: RespondToFeedbackPollDto, user: any) {
    const { answers } = dto;

    if (!answers || typeof answers !== 'object') {
      throw new BadRequestException('Answers payload is required.');
    }

    const poll = this.feedbackRepo.findFeedbackPollById(pollId);
    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    if (poll.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Feedback poll is not active or has been closed.',
      );
    }

    const existing = this.feedbackRepo.findExistingResponse(pollId, user.id);
    if (existing) {
      throw new BadRequestException(
        'You have already submitted feedback for this event.',
      );
    }

    const responseId = `resp_${crypto.randomUUID()}`;

    try {
      (() => {
        this.feedbackRepo.insertFeedbackResponse({
          id: responseId,
          pollId,
          attendeeId: user.id,
        });

        Object.entries(answers).forEach(([qId, val]) => {
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            this.feedbackRepo.insertFeedbackAnswer({
              id: `ans_${crypto.randomUUID()}`,
              responseId,
              questionId: qId,
              answerValue: String(val).trim(),
            });
          }
        });
      })();

      return {
        success: true,
        message:
          '✓ Thank you for your feedback! Your response has been recorded.',
      };
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('UNIQUE constraint failed') ||
          err.message.includes('SQLITE_CONSTRAINT'))
      ) {
        throw new BadRequestException(
          'You have already submitted feedback for this event.',
        );
      }
      throw err;
    }
  }

  getPollResults(pollId: string, user: any) {
    const role = (user.role || '').toUpperCase();
    if (
      role !== 'EVENT_MANAGER' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'DEPARTMENT_MANAGER'
    ) {
      throw new ForbiddenException('Unauthorized.');
    }

    const poll = this.feedbackRepo.findPollWithEventDetails(pollId);
    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    const confirmedTicketsCount = this.feedbackRepo.countConfirmedTicketsByEventId(
      poll.eventId,
    );
    const totalAttendees = Math.max(confirmedTicketsCount, 1);

    const totalResponses = this.feedbackRepo.countResponsesByPollId(pollId);
    const responseRate = Number(
      ((totalResponses / totalAttendees) * 100).toFixed(1),
    );

    const questions = this.feedbackRepo.findFeedbackQuestionsByPollId(pollId);

    let ratingSum = 0;
    let ratingCount = 0;

    const questionAnalytics = questions.map((q) => {
      const options = q.options ? JSON.parse(q.options) : [];
      const answers = this.feedbackRepo.findAnswersByQuestionAndPoll(
        q.id,
        pollId,
      );

      if (q.questionType === 'RATING') {
        const ratings = answers
          .map((v) => Number(v))
          .filter((v) => !isNaN(v) && v >= 1 && v <= 5);
        const avg =
          ratings.length > 0
            ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
            : 0;

        ratings.forEach((r) => {
          ratingSum += r;
          ratingCount++;
        });

        const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratings.forEach((r) => {
          if (breakdown[r] !== undefined) breakdown[r]++;
        });

        return {
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          totalAnswers: ratings.length,
          averageRating: Number(avg),
          breakdown: [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: breakdown[star],
            percentage:
              ratings.length > 0
                ? Number(((breakdown[star] / ratings.length) * 100).toFixed(1))
                : 0,
          })),
        };
      } else if (q.questionType === 'CHOICE' || q.questionType === 'YES_NO') {
        const validOptions =
          q.questionType === 'YES_NO' ? ['Yes', 'Maybe', 'No'] : options;
        const counts: Record<string, number> = {};
        validOptions.forEach((opt: string) => {
          counts[opt] = 0;
        });

        answers.forEach((ans) => {
          if (counts[ans] !== undefined) counts[ans]++;
          else counts[ans] = 1;
        });

        const totalAns = answers.length;
        return {
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          totalAnswers: totalAns,
          optionBreakdown: Object.entries(counts).map(([opt, cnt]) => ({
            option: opt,
            count: cnt,
            percentage:
              totalAns > 0 ? Number(((cnt / totalAns) * 100).toFixed(1)) : 0,
          })),
        };
      } else {
        // TEXT
        return {
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          totalAnswers: answers.length,
          comments: answers.filter((a) => a.trim() !== ''),
        };
      }
    });

    const overallAverageRating =
      ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0;

    return {
      analytics: {
        pollId,
        pollTitle: poll.title,
        eventName: poll.eventName,
        status: poll.status,
        totalAttendees,
        totalResponses,
        responseRate,
        overallAverageRating,
        questions: questionAnalytics,
      },
    };
  }
}
