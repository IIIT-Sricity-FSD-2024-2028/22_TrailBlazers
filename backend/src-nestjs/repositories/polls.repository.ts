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

  findAllLaunchedPolls(): EventPoll[] {
    return this.store
      .find<EventPoll>('event_polls', (p) => p.status === 'LAUNCHED')
      .sort((a, b) => (b.launchedAt || '').localeCompare(a.launchedAt || ''));
  }

  findTicketsByUserId(userId: string): any[] {
    if (!userId) return [];
    return this.store.find('tickets', (t) => t.userId === userId);
  }

  findEventRequestsByUserId(userId: string): any[] {
    if (!userId) return [];
    return this.store.find('event_requests', (r) => r.userId === userId);
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
    const direct = this.store.findOne<any>(
      'tickets',
      (t) => t.userId === userId && t.eventId === eventId,
    );
    if (direct) return direct;

    const event = this.findEventOrRequestById(eventId);
    if (event) {
      return (
        this.store.findOne<any>(
          'tickets',
          (t) =>
            t.userId === userId &&
            (t.eventId === event.id ||
              (t.eventTitle &&
                (t.eventTitle === event.eventName ||
                  t.eventTitle === event.name))),
        ) || null
      );
    }
    return null;
  }

  findEventRequestByUserAndEvent(userId: string, eventId: string): any {
    if (!userId || !eventId) return null;
    const direct = this.store.findOne<any>(
      'event_requests',
      (r) => r.userId === userId && r.id === eventId,
    );
    if (direct) return direct;

    const event = this.findEventOrRequestById(eventId);
    if (
      event &&
      (event.userId === userId ||
        event.organizerUserId === userId ||
        event.createdByUserId === userId)
    ) {
      return event;
    }
    return null;
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
    const existing = this.store.findById('event_sessions', sessionId);
    if (existing) return existing;

    // Handle default agenda session IDs from client workspace: sess_default_<idx>_<eventId>
    if (sessionId.startsWith('sess_default_')) {
      const parts = sessionId.split('_');
      const eventId = parts.slice(3).join('_');
      const event = this.findEventOrRequestById(eventId) ||
        this.store.findOne('event_requests', (r: any) => sessionId.includes(r.id)) ||
        this.store.findOne('events', (e: any) => sessionId.includes(e.id));

      if (event) {
        const idx = parts[2] || '1';
        const isOpening = idx === '1';
        const sessionEntity = {
          id: sessionId,
          eventId: event.id,
          title: isOpening
            ? `${event.eventName || event.name || 'Event'} — Opening Keynote & Workshop`
            : `${event.eventName || event.name || 'Event'} — Technical Deep Dive & Interactive Q&A`,
          hall: isOpening ? (event.venue || 'Main Auditorium') : 'Seminar Hall B',
          startTime: isOpening ? (event.startTime || '09:00 AM') : '01:30 PM',
          endTime: isOpening ? (event.endTime || '12:00 PM') : '05:00 PM',
          speakerName: isOpening ? 'Lead Keynote Speaker' : 'Industry Panel Speaker',
          status: 'SCHEDULED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return this.store.create('event_sessions', sessionEntity);
      }
    }

    return null;
  }

  findEventOrRequestById(eventId: string): any | null {
    if (!eventId) return null;
    const evt = this.store.findById<any>('events', eventId);
    const req = this.store.findById<any>('event_requests', eventId);
    if (evt && req) {
      return { ...evt, ...req, userId: req.userId || evt.userId || evt.organizerUserId };
    }
    if (evt) {
      if (!evt.userId) {
        const matchingReq = this.store.findOne<any>('event_requests', (r: any) => r.id === evt.id || (r.eventName && r.eventName === evt.name));
        if (matchingReq && matchingReq.userId) {
          return { ...evt, userId: matchingReq.userId };
        }
      }
      return evt;
    }
    return req;
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

