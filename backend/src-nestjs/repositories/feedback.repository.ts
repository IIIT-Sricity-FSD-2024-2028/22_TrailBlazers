import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

export interface EventFeedbackRow {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface FeedbackPollRow {
  id: string;
  eventId: string;
  createdByUserId: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
  closedAt?: string;
  eventName?: string;
  eventDate?: string;
  venue?: string;
}

export interface FeedbackQuestionRow {
  id: string;
  pollId: string;
  questionText: string;
  questionType: string;
  options?: string;
  displayOrder: number;
}

@Injectable()
export class FeedbackRepository {
  constructor(private readonly store: InMemoryStore) {}

  resolveCandidateEventIds(eventId: string): Set<string> {
    const candidateIds = new Set<string>();
    if (!eventId) return candidateIds;
    candidateIds.add(eventId);

    const event = this.store.findById<any>('events', eventId);
    if (event && event.eventRequestId) {
      candidateIds.add(event.eventRequestId);
    }

    const eventReq = this.store.findById<any>('event_requests', eventId);
    if (eventReq) {
      const linkedEvent = this.store.findOne<any>(
        'events',
        (e) => e.eventRequestId === eventReq.id,
      );
      if (linkedEvent) candidateIds.add(linkedEvent.id);
    }

    return candidateIds;
  }

  // Core Event Feedback methods
  findEventById(id: string): any {
    if (!id) return null;
    return this.store.findById('events', id);
  }

  findEventRequestById(id: string): any {
    if (!id) return null;
    return this.store.findById('event_requests', id);
  }

  findConfirmedTicketByUserAndEvent(userId: string, eventId: string): any {
    if (!userId || !eventId) return null;
    const candidates = this.resolveCandidateEventIds(eventId);
    return (
      this.store.findOne<any>(
        'tickets',
        (t) =>
          t.userId === userId &&
          candidates.has(t.eventId) &&
          (t.paymentStatus === 'CONFIRMED' ||
            t.paymentStatus === 'SUCCESS' ||
            t.registrationStatus === 'CONFIRMED' ||
            t.registrationStatus === 'ACTIVE'),
      ) || null
    );
  }

  findFeedbackByEventAndUser(
    eventId: string,
    userId: string,
  ): EventFeedbackRow | null {
    if (!eventId || !userId) return null;
    const candidates = this.resolveCandidateEventIds(eventId);
    return (
      this.store.findOne<EventFeedbackRow>(
        'event_feedback',
        (f) => candidates.has(f.eventId) && f.userId === userId,
      ) || null
    );
  }

  insertFeedback(data: {
    id: string;
    eventId: string;
    userId: string;
    rating: number;
    comment?: string;
  }): void {
    const existing = this.findFeedbackByEventAndUser(data.eventId, data.userId);
    if (existing) {
      const err: any = new Error(
        'UNIQUE constraint failed: event_feedback.eventId, event_feedback.userId',
      );
      err.code = 'SQLITE_CONSTRAINT';
      throw err;
    }
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('event_feedback', {
      id: data.id,
      eventId: data.eventId,
      userId: data.userId,
      rating: data.rating,
      comment: data.comment || null,
      createdAt: nowStr,
    });
  }

  // Feedback Polls methods
  insertFeedbackPoll(data: {
    id: string;
    eventId: string;
    createdByUserId: string;
    title: string;
    description?: string;
    status: string;
    publishedAt?: string | null;
  }): void {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('feedback_polls', {
      id: data.id,
      eventId: data.eventId,
      createdByUserId: data.createdByUserId,
      title: data.title,
      description: data.description || '',
      status: data.status,
      createdAt: nowStr,
      publishedAt: data.publishedAt || null,
    });
  }

  insertFeedbackQuestion(data: {
    id: string;
    pollId: string;
    questionText: string;
    questionType: string;
    options?: string | null;
    displayOrder: number;
  }): void {
    this.store.create('feedback_questions', {
      id: data.id,
      pollId: data.pollId,
      questionText: data.questionText,
      questionType: data.questionType,
      options: data.options || null,
      displayOrder: data.displayOrder,
    });
  }

  findFeedbackPollById(pollId: string): FeedbackPollRow | null {
    if (!pollId) return null;
    return this.store.findById<FeedbackPollRow>('feedback_polls', pollId);
  }

  findFeedbackPollsByEventId(
    eventId: string,
    isManager: boolean,
  ): FeedbackPollRow[] {
    if (!eventId) return [];
    let polls = this.store.find<FeedbackPollRow>(
      'feedback_polls',
      (p) => p.eventId === eventId,
    );

    if (!isManager) {
      polls = polls.filter(
        (p) => p.status === 'PUBLISHED' || p.status === 'CLOSED',
      );
    }

    return polls.sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || ''),
    );
  }

  findAttendeePolls(userId: string): FeedbackPollRow[] {
    if (!userId) return [];
    const attendeeTickets = this.store.find<any>(
      'tickets',
      (t) => t.userId === userId,
    );
    const eventIds = new Set<string>();
    attendeeTickets.forEach((t) => {
      this.resolveCandidateEventIds(t.eventId).forEach((id) => eventIds.add(id));
    });
    if (eventIds.size === 0) return [];

    const polls = this.store.find<FeedbackPollRow>(
      'feedback_polls',
      (p) =>
        eventIds.has(p.eventId) &&
        (p.status === 'PUBLISHED' || p.status === 'CLOSED'),
    );

    const mapped = polls.map((p) => {
      const evt =
        this.store.findById<any>('events', p.eventId) ||
        this.store.findById<any>('event_requests', p.eventId);
      return {
        ...p,
        eventName: evt ? evt.name || evt.eventName : null,
        eventDate: evt ? evt.date || evt.eventDate : null,
        venue: evt ? evt.venue : null,
      };
    });

    return mapped.sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || ''),
    );
  }

  findFeedbackQuestionsByPollId(pollId: string): FeedbackQuestionRow[] {
    if (!pollId) return [];
    return this.store
      .find<FeedbackQuestionRow>(
        'feedback_questions',
        (q) => q.pollId === pollId,
      )
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
  }

  countTicketsByEventId(eventId: string): number {
    if (!eventId) return 0;
    return this.store.count('tickets', (t) => t.eventId === eventId);
  }

  countConfirmedTicketsByEventId(eventId: string): number {
    if (!eventId) return 0;
    return this.store.count(
      'tickets',
      (t) => t.eventId === eventId && t.paymentStatus === 'CONFIRMED',
    );
  }

  countResponsesByPollId(pollId: string): number {
    if (!pollId) return 0;
    return this.store.count('feedback_responses', (r) => r.pollId === pollId);
  }

  findExistingResponse(pollId: string, attendeeId: string): any {
    if (!pollId || !attendeeId) return null;
    return (
      this.store.findOne<any>(
        'feedback_responses',
        (r) => r.pollId === pollId && r.attendeeId === attendeeId,
      ) || null
    );
  }

  updatePollStatusToPublished(pollId: string): void {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.update<any>('feedback_polls', pollId, {
      status: 'PUBLISHED',
      publishedAt: nowStr,
    });
  }

  updatePollStatusToClosed(pollId: string): number {
    const poll = this.store.findById('feedback_polls', pollId);
    if (!poll) return 0;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.update<any>('feedback_polls', pollId, {
      status: 'CLOSED',
      closedAt: nowStr,
    });
    return 1;
  }

  deletePoll(pollId: string): number {
    const poll = this.store.findById('feedback_polls', pollId);
    if (!poll) return 0;
    this.store.delete('feedback_polls', pollId);
    // Delete associated questions
    const qList = this.store.find<any>('feedback_questions', (q) => q.pollId === pollId);
    for (const q of qList) {
      this.store.delete('feedback_questions', q.id);
    }
    return 1;
  }

  insertFeedbackResponse(data: {
    id: string;
    pollId: string;
    attendeeId: string;
  }): void {
    const existing = this.findExistingResponse(data.pollId, data.attendeeId);
    if (existing) {
      const err: any = new Error(
        'UNIQUE constraint failed: feedback_responses.pollId, feedback_responses.attendeeId',
      );
      err.code = 'SQLITE_CONSTRAINT';
      throw err;
    }
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('feedback_responses', {
      id: data.id,
      pollId: data.pollId,
      attendeeId: data.attendeeId,
      submittedAt: nowStr,
    });
  }

  insertFeedbackAnswer(data: {
    id: string;
    responseId: string;
    questionId: string;
    answerValue: string;
  }): void {
    this.store.create('feedback_answers', {
      id: data.id,
      responseId: data.responseId,
      questionId: data.questionId,
      answerValue: data.answerValue,
    });
  }

  findPollWithEventDetails(pollId: string): any {
    if (!pollId) return null;
    const poll = this.store.findById<any>('feedback_polls', pollId);
    if (!poll) return null;
    const evt = this.store.findById<any>('events', poll.eventId);
    return {
      ...poll,
      eventName: evt ? evt.name : null,
      totalTickets: evt ? evt.totalTickets : null,
      availableTickets: evt ? evt.availableTickets : null,
    };
  }

  findAnswersByQuestionAndPoll(questionId: string, pollId: string): string[] {
    if (!questionId || !pollId) return [];
    const pollResponses = this.store.find<any>(
      'feedback_responses',
      (r) => r.pollId === pollId,
    );
    const responseIds = new Set(pollResponses.map((r) => r.id));

    const answers = this.store.find<any>(
      'feedback_answers',
      (a) => a.questionId === questionId && responseIds.has(a.responseId),
    );

    return answers.map((a) => a.answerValue);
  }
}
