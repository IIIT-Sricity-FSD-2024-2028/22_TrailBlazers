import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

export interface AnalyticsAuditLogParams {
  id: string;
  eventId: string;
  actorUserId: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  details?: string;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly store: InMemoryStore) {}

  getCompletedEventsForUser(user: { id: string; role?: string }) {
    const role = (user.role || '').toUpperCase();
    const evts = this.store.findAll<any>('events');

    const filtered = evts.filter((e) => {
      const r = this.store.findById<any>('event_requests', e.id);
      const isCompletedOrPublished =
        e.status === 'COMPLETED' ||
        (r && r.operationalStatus === 'COMPLETED') ||
        e.status === 'PUBLISHED';

      if (!isCompletedOrPublished) return false;

      if (role === 'EVENT_MANAGER') {
        return (
          (r && r.eventManagerUserId === user.id) ||
          !r ||
          !r.eventManagerUserId
        );
      } else if (role === 'ATTENDEE') {
        return (r && r.userId === user.id) || e.organizerUserId === user.id;
      }
      return true;
    });

    return filtered
      .map((e) => {
        const r = this.store.findById<any>('event_requests', e.id);
        return {
          ...e,
          operationalStatus: r ? r.operationalStatus : null,
          clientUserId: r ? r.userId : null,
          eventManagerUserId: r ? r.eventManagerUserId : null,
        };
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  getEventById(eventId: string) {
    if (!eventId) return null;
    return this.store.findById('events', eventId);
  }

  getEventRequestById(eventId: string) {
    if (!eventId) return null;
    return this.store.findById('event_requests', eventId);
  }

  getTicketsForEvent(eventId: string) {
    if (!eventId) return [];
    return this.store.find(
      'tickets',
      (t) => t.eventId === eventId && t.registrationStatus === 'ACTIVE',
    );
  }

  getCheckInTimeline(eventId: string) {
    if (!eventId) return [];
    const tkts = this.store.find<any>(
      'tickets',
      (t) => t.eventId === eventId && (t.checkedIn === 1 || t.checkedIn === true) && !!t.checkedInAt,
    );

    const countsByHour: { [hour: string]: number } = {};
    for (const t of tkts) {
      const dateObj = new Date(t.checkedInAt);
      if (!isNaN(dateObj.getTime())) {
        const hourStr = `${dateObj.toISOString().split('T')[0]} ${String(dateObj.getUTCHours()).padStart(2, '0')}:00`;
        countsByHour[hourStr] = (countsByHour[hourStr] || 0) + 1;
      }
    }

    const sortedHours = Object.keys(countsByHour).sort();
    return sortedHours.map((hour) => ({ hour, count: countsByHour[hour] }));
  }

  getQAStats(eventId: string) {
    if (!eventId) return { total: 0, approved: 0, answered: 0, rejected: 0, pending: 0 };
    const qList = this.store.find<any>('event_qa_questions', (q) => q.eventId === eventId);
    let approved = 0;
    let answered = 0;
    let rejected = 0;
    let pending = 0;

    for (const q of qList) {
      if (q.status === 'APPROVED' || q.status === 'ANSWERED') approved++;
      if (q.status === 'ANSWERED') answered++;
      if (q.status === 'REJECTED') rejected++;
      if (q.status === 'PENDING') pending++;
    }

    return {
      total: qList.length,
      approved,
      answered,
      rejected,
      pending,
    };
  }

  getPollsCount(eventId: string) {
    if (!eventId) return { pollsCount: 0 };
    const pollsCount = this.store.count('event_polls', (p) => p.eventId === eventId);
    return { pollsCount };
  }

  getPollResponsesCount(eventId: string) {
    if (!eventId) return { responsesCount: 0 };
    const polls = this.store.find<any>('event_polls', (p) => p.eventId === eventId);
    const pollIds = new Set(polls.map((p) => p.id));
    const responsesCount = this.store.count('event_poll_responses', (r) => pollIds.has(r.pollId));
    return { responsesCount };
  }

  getFeedbackCount(eventId: string) {
    if (!eventId) return 0;
    return this.store.count('event_feedback', (f) => f.eventId === eventId);
  }

  getConfirmedTicketsCount(eventId: string) {
    if (!eventId) return 1;
    const cnt = this.store.count(
      'tickets',
      (t) => t.eventId === eventId && t.paymentStatus === 'CONFIRMED',
    );
    return cnt > 0 ? cnt : 1;
  }

  getFeedbackRows(eventId: string) {
    if (!eventId) return [];
    return this.store
      .find<any>('event_feedback', (f) => f.eventId === eventId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .map((f) => ({
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt,
      }));
  }

  getSessionsWithSpeakers(eventId: string) {
    if (!eventId) return [];
    const sessions = this.store.find<any>('event_sessions', (s) => s.eventId === eventId);
    const mapped = sessions.map((s) => {
      const speaker = s.speakerUserId ? this.store.findById<any>('users', s.speakerUserId) : null;
      return {
        ...s,
        speakerName: speaker ? speaker.name : null,
        speakerOrg: speaker ? speaker.organization : null,
      };
    });
    return mapped.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }

  getSessionQAStats(sessionId: string) {
    if (!sessionId) return { qaTotal: 0, qaAnswered: 0 };
    const qaTotal = this.store.count('event_qa_questions', (q) => q.sessionId === sessionId);
    const qaAnswered = this.store.count(
      'event_qa_questions',
      (q) => q.sessionId === sessionId && q.status === 'ANSWERED',
    );
    return { qaTotal, qaAnswered };
  }

  getSessionPollsCount(sessionId: string) {
    if (!sessionId) return 0;
    return this.store.count('event_polls', (p) => p.sessionId === sessionId);
  }

  getSessionPollResponses(sessionId: string) {
    if (!sessionId) return 0;
    const polls = this.store.find<any>('event_polls', (p) => p.sessionId === sessionId);
    const pollIds = new Set(polls.map((p) => p.id));
    return this.store.count('event_poll_responses', (r) => pollIds.has(r.pollId));
  }

  getAllPollsForEvent(eventId: string) {
    if (!eventId) return [];
    return this.store
      .find<any>('event_polls', (p) => p.eventId === eventId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  getPollOptions(pollId: string) {
    if (!pollId) return [];
    return this.store
      .find<any>('event_poll_options', (o) => o.pollId === pollId)
      .sort((a, b) => Number(a.optionOrder || 0) - Number(b.optionOrder || 0));
  }

  getPollResponses(pollId: string) {
    if (!pollId) return [];
    return this.store
      .find<any>('event_poll_responses', (r) => r.pollId === pollId)
      .map((r) => ({ optionId: r.optionId }));
  }

  getQuestionsWithUsers(eventId: string) {
    if (!eventId) return [];
    const questions = this.store.find<any>('event_qa_questions', (q) => q.eventId === eventId);
    const mapped = questions.map((q) => {
      const user = this.store.findById<any>('users', q.userId);
      return {
        ...q,
        userName: user ? user.name : q.userName,
      };
    });

    return mapped.sort((a, b) => {
      if ((b.upvoteCount || 0) !== (a.upvoteCount || 0)) {
        return (b.upvoteCount || 0) - (a.upvoteCount || 0);
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  insertAnalyticsAuditLog(log: AnalyticsAuditLogParams) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('analytics_audit_logs', {
      id: log.id,
      eventId: log.eventId,
      actorUserId: log.actorUserId,
      actorName: log.actorName || null,
      actorRole: log.actorRole || null,
      action: log.action,
      details: log.details || null,
      createdAt: nowStr,
    });
  }
}
