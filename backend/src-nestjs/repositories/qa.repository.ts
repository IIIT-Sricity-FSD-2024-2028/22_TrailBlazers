import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';

export interface EventQaQuestion {
  id: string;
  eventId: string;
  sessionId?: string;
  userId: string;
  userName: string;
  questionText: string;
  status: string;
  rejectionReason?: string;
  upvoteCount: number;
  approvedByUserId?: string;
  approvedAt?: string;
  answeredAt?: string;
  answeredByUserId?: string;
  createdAt: string;
}

@Injectable()
export class QaRepository {
  constructor(private readonly store: InMemoryStore) {}

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

  findEventRequestById(eventId: string): any {
    if (!eventId) return null;
    return this.store.findById('event_requests', eventId);
  }

  insertQuestion(data: {
    id: string;
    eventId: string;
    sessionId?: string;
    userId: string;
    userName: string;
    questionText: string;
  }): void {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('event_qa_questions', {
      id: data.id,
      eventId: data.eventId,
      sessionId: data.sessionId || null,
      userId: data.userId,
      userName: data.userName,
      questionText: data.questionText.trim(),
      status: 'PENDING',
      upvoteCount: 0,
      createdAt: nowStr,
    });
  }

  findQuestionById(id: string): EventQaQuestion | null {
    if (!id) return null;
    return this.store.findById<EventQaQuestion>('event_qa_questions', id);
  }

  insertUpvoteAtomic(
    upvoteId: string,
    questionId: string,
    userId: string,
  ): { upvoteCount: number } {
    const existingUpvote = this.store.findOne<any>(
      'event_qa_upvotes',
      (u) => u.questionId === questionId && u.userId === userId,
    );

    if (existingUpvote) {
      const q = this.store.findById<EventQaQuestion>('event_qa_questions', questionId);
      return { upvoteCount: q ? q.upvoteCount : 0 };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.store.create('event_qa_upvotes', {
      id: upvoteId,
      questionId,
      userId,
      createdAt: nowStr,
    });

    const q = this.store.findById<EventQaQuestion>('event_qa_questions', questionId);
    const newCount = (q ? q.upvoteCount || 0 : 0) + 1;
    this.store.update<EventQaQuestion>('event_qa_questions', questionId, {
      upvoteCount: newCount,
    });

    return { upvoteCount: newCount };
  }
}
