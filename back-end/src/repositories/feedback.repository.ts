import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export interface Feedback {
  id: string;
  eventId: string;
  attendeeId: string;
  attendeeEmail: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: string;
}

const FEEDBACK_SEED: Feedback[] = [];

@Injectable()
export class FeedbackRepository extends BaseRepository<Feedback> {
  constructor() { super('feedback.json', FEEDBACK_SEED); }
  findByEvent(eventId: string)       { return this.store.filter(f => f.eventId === eventId); }
  findByAttendee(attendeeId: string) { return this.store.filter(f => f.attendeeId === attendeeId); }
  avgRating(eventId: string): number {
    const items = this.findByEvent(eventId);
    if (!items.length) return 0;
    return items.reduce((s, f) => s + f.rating, 0) / items.length;
  }
  nextFeedbackId(): string { return this.nextId('fb'); }
}
