import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import { NestLoggerService } from '../common/logging/logger.service';

@Injectable()
export class EventsRepository {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  findPublishedEvents(filters: {
    search?: string;
    category?: string;
    price?: string;
    type?: string;
    location?: string;
  } = {}): any[] {
    const publishedEvents = this.store.find<any>('events', (e) => e.status === 'PUBLISHED');
    const existingIds = new Set(publishedEvents.map((e) => e.id));

    const requestEvents = this.store.find<any>(
      'event_requests',
      (r) =>
        !existingIds.has(r.id) &&
        (r.registrationStatus === 'OPEN' ||
          r.operationalStatus === 'READY' ||
          r.status === 'COMMERCIAL_APPROVED' ||
          r.status === 'ACCEPTED'),
    ).map((req) => ({
      id: req.id,
      name: req.eventName,
      eventName: req.eventName,
      organizationName: req.organizationName,
      category: req.category,
      date: req.eventDate,
      eventDate: req.eventDate,
      startTime: req.startTime || '09:00 AM',
      endTime: req.endTime || '05:00 PM',
      venue: req.venue,
      location: req.venue,
      type: req.eventType || 'PUBLIC',
      registrationStatus: req.registrationStatus || 'OPEN',
      ticketPrice: req.ticketPrice || 0,
      totalTickets: req.expectedAttendance || 100,
      availableTickets: req.expectedAttendance || 100,
      status: 'PUBLISHED',
      description: req.additionalNotes || req.eventName,
      bannerUrl: req.bannerUrl || null,
    }));

    let events = [...publishedEvents, ...requestEvents];

    const { search, category, price, type, location } = filters;

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      events = events.filter(
        (e) =>
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.description && e.description.toLowerCase().includes(term)) ||
          (e.location && e.location.toLowerCase().includes(term)) ||
          (e.organizationName && e.organizationName.toLowerCase().includes(term)),
      );
    }

    if (category && category !== 'All') {
      events = events.filter((e) => e.category === category);
    }

    if (type && type !== 'All') {
      events = events.filter((e) => e.type === type);
    }

    if (location && location !== 'All') {
      const locTerm = location.toLowerCase();
      events = events.filter((e) => e.location && e.location.toLowerCase().includes(locTerm));
    }

    if (price === 'free') {
      events = events.filter((e) => Number(e.ticketPrice) === 0);
    } else if (price === 'paid') {
      events = events.filter((e) => Number(e.ticketPrice) > 0);
    }

    return events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  findEventById(id: string): any | null {
    if (!id) return null;
    const event = this.store.findById<any>('events', id);
    if (event) return event;

    const req = this.store.findById<any>('event_requests', id);
    if (req) {
      return {
        id: req.id,
        name: req.eventName,
        eventName: req.eventName,
        organizationName: req.organizationName,
        category: req.category,
        date: req.eventDate,
        eventDate: req.eventDate,
        startTime: req.startTime || '09:00 AM',
        endTime: req.endTime || '05:00 PM',
        venue: req.venue,
        location: req.venue,
        type: req.eventType || 'PUBLIC',
        registrationStatus: req.registrationStatus || 'OPEN',
        ticketPrice: req.ticketPrice || 0,
        totalTickets: req.expectedAttendance || 100,
        availableTickets: req.expectedAttendance || 100,
        status: 'PUBLISHED',
        description: req.additionalNotes || req.eventName,
        bannerUrl: req.bannerUrl || null,
        isEventRequest: true,
      };
    }

    return null;
  }

  findEventRequestById(id: string): any | null {
    if (!id) return null;
    return this.store.findById('event_requests', id);
  }

  findTicketByUserAndEvent(userId: string, eventId: string): any | null {
    if (!userId || !eventId) return null;
    return this.store.findOne('tickets', (t) => t.userId === userId && t.eventId === eventId);
  }

  findConfirmedTicketByUserAndEvent(userId: string, eventId: string): any | null {
    if (!userId || !eventId) return null;
    return this.store.findOne(
      'tickets',
      (t) => t.userId === userId && t.eventId === eventId && t.paymentStatus === 'CONFIRMED',
    );
  }

  findEventRequestByUserAndEvent(userId: string, eventId: string): any | null {
    if (!userId || !eventId) return null;
    return this.store.findOne(
      'event_requests',
      (r) => r.userId === userId && r.id === eventId,
    );
  }

  insertQuestion(params: {
    id: string;
    eventId: string;
    sessionId?: string;
    userId: string;
    userName: string;
    questionText: string;
  }): string {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('event_qa_questions', {
      id: params.id,
      eventId: params.eventId,
      sessionId: params.sessionId || null,
      userId: params.userId,
      userName: params.userName,
      questionText: params.questionText.trim(),
      status: 'PENDING',
      upvoteCount: 0,
      createdAt: nowStr,
    });
    return params.id;
  }

  findQuestionById(id: string): any | null {
    if (!id) return null;
    return this.store.findById('event_qa_questions', id);
  }

  insertUpvote(params: { id: string; questionId: string; userId: string }): {
    upvoteCount: number;
  } {
    const existing = this.store.findOne(
      'event_qa_upvotes',
      (u) => u.questionId === params.questionId && u.userId === params.userId,
    );

    if (existing) {
      const err = new Error('UNIQUE constraint failed: event_qa_upvotes.questionId, event_qa_upvotes.userId');
      (err as any).code = 'SQLITE_CONSTRAINT';
      throw err;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('event_qa_upvotes', {
      id: params.id,
      questionId: params.questionId,
      userId: params.userId,
      createdAt: nowStr,
    });

    const question = this.store.findById<any>('event_qa_questions', params.questionId);
    const newCount = (question ? Number(question.upvoteCount) || 0 : 0) + 1;
    this.store.update<any>('event_qa_questions', params.questionId, {
      upvoteCount: newCount,
    });

    return { upvoteCount: newCount };
  }

  findActivePollsByEventId(eventId: string): any[] {
    if (!eventId) return [];
    return this.store
      .find<any>('event_polls', (p) => p.eventId === eventId && p.status === 'LAUNCHED')
      .sort((a, b) => (b.launchedAt || b.createdAt || '').localeCompare(a.launchedAt || a.createdAt || ''));
  }

  findPollOptionsByPollId(pollId: string): any[] {
    if (!pollId) return [];
    return this.store
      .find<any>('event_poll_options', (o) => o.pollId === pollId)
      .sort((a, b) => Number(a.optionOrder || 0) - Number(b.optionOrder || 0))
      .map((o) => ({ id: o.id, optionText: o.optionText, optionOrder: o.optionOrder }));
  }

  findPollById(pollId: string): any | null {
    if (!pollId) return null;
    return this.store.findById('event_polls', pollId);
  }

  findPollOptionByIdAndPollId(optionId: string, pollId: string): any | null {
    if (!optionId || !pollId) return null;
    return this.store.findOne('event_poll_options', (o) => o.id === optionId && o.pollId === pollId);
  }

  insertPollResponse(params: {
    id: string;
    pollId: string;
    optionId: string;
    userId: string;
  }): string {
    const existing = this.store.findOne(
      'event_poll_responses',
      (r) => r.pollId === params.pollId && r.userId === params.userId,
    );

    if (existing) {
      const err = new Error('UNIQUE constraint failed: event_poll_responses.pollId, event_poll_responses.userId');
      (err as any).code = 'SQLITE_CONSTRAINT';
      throw err;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('event_poll_responses', {
      id: params.id,
      pollId: params.pollId,
      optionId: params.optionId,
      userId: params.userId,
      createdAt: nowStr,
    });

    return params.id;
  }

  findFeedbackByEventAndUser(eventId: string, userId: string): any | null {
    if (!eventId || !userId) return null;
    return this.store.findOne('event_feedback', (f) => f.eventId === eventId && f.userId === userId);
  }

  insertFeedback(params: {
    id: string;
    eventId: string;
    userId: string;
    rating: number;
    comment?: string;
  }): string {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('event_feedback', {
      id: params.id,
      eventId: params.eventId,
      userId: params.userId,
      rating: params.rating,
      comment: params.comment || null,
      createdAt: nowStr,
    });
    return params.id;
  }
}
