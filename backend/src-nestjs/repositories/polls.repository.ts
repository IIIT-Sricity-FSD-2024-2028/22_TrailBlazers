import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

export interface EventPoll {
  id: string;
  eventId: string;
  sessionId?: string;
  speakerUserId?: string;
  questionText: string;
  status: string;
  launchedAt?: string;
  createdAt: string;
}

export interface EventPollOption {
  id: string;
  optionText: string;
  optionOrder: number;
}

@Injectable()
export class PollsRepository {
  constructor(private readonly store: InMemoryStore) {}

  findActivePollsByEventId(eventId: string): EventPoll[] {
    if (!eventId) return [];
    return this.store
      .find<EventPoll>(
        'event_polls',
        (p) => p.eventId === eventId && p.status === 'LAUNCHED',
      )
      .sort((a, b) => (b.launchedAt || '').localeCompare(a.launchedAt || ''));
  }

  findPollOptionsByPollId(pollId: string): EventPollOption[] {
    if (!pollId) return [];
    return this.store
      .find<EventPollOption>(
        'event_poll_options',
        (o) => (o as any).pollId === pollId,
      )
      .sort((a, b) => Number(a.optionOrder || 0) - Number(b.optionOrder || 0));
  }

  findPollById(pollId: string): EventPoll | null {
    if (!pollId) return null;
    return this.store.findById<EventPoll>('event_polls', pollId);
  }

  findPollOptionByIdAndPollId(optionId: string, pollId: string): any {
    if (!optionId || !pollId) return null;
    return (
      this.store.findOne<any>(
        'event_poll_options',
        (o) => o.id === optionId && o.pollId === pollId,
      ) || null
    );
  }

  findTicketByUserAndEvent(userId: string, eventId: string): any {
    if (!userId || !eventId) return null;
    return (
      this.store.findOne<any>(
        'tickets',
        (t) => t.userId === userId && t.eventId === eventId,
      ) || null
    );
  }

  findEventRequestByUserAndEvent(userId: string, eventId: string): any {
    if (!userId || !eventId) return null;
    return (
      this.store.findOne<any>(
        'event_requests',
        (r) => r.userId === userId && r.id === eventId,
      ) || null
    );
  }

  insertPollResponse(data: {
    id: string;
    pollId: string;
    optionId: string;
    userId: string;
  }): void {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('event_poll_responses', {
      id: data.id,
      pollId: data.pollId,
      optionId: data.optionId,
      userId: data.userId,
      createdAt: nowStr,
    });
  }

  findSessionById(sessionId: string): any | null {
    if (!sessionId) return null;
    return this.store.findById('event_sessions', sessionId);
  }

  findEventOrRequestById(eventId: string): any | null {
    if (!eventId) return null;
    const evt = this.store.findById('events', eventId);
    if (evt) return evt;
    return this.store.findById('event_requests', eventId);
  }

  findPollsBySessionId(sessionId: string): EventPoll[] {
    if (!sessionId) return [];
    return this.store
      .find<EventPoll>('event_polls', (p) => p.sessionId === sessionId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  getPollResponsesByPollId(pollId: string): any[] {
    if (!pollId) return [];
    return this.store.find('event_poll_responses', (r) => r.pollId === pollId);
  }

  createSessionPollTransaction(params: {
    pollId: string;
    eventId: string;
    sessionId: string;
    questionText: string;
    options: string[];
    status?: string;
    createdByUserId: string;
  }): any {
    const { pollId, eventId, sessionId, questionText, options, status = 'LAUNCHED', createdByUserId } = params;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newPoll: any = {
      id: pollId,
      eventId,
      sessionId,
      questionText: questionText.trim(),
      status: status || 'LAUNCHED',
      createdByUserId,
      launchedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    this.store.create('event_polls', newPoll);

    const createdOptions: any[] = [];
    options.forEach((optText, idx) => {
      const optId = `popt_${pollId.substring(0, 8)}_${idx + 1}`;
      const optEntity = {
        id: optId,
        pollId,
        optionText: optText.trim(),
        optionOrder: idx + 1,
        createdAt: nowStr,
      };
      this.store.create('event_poll_options', optEntity);
      createdOptions.push(optEntity);
    });

    return {
      poll: newPoll,
      options: createdOptions,
    };
  }
}

