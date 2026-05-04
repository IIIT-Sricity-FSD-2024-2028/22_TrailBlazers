import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export interface PollResponse {
  id: string;
  pollId: string;
  attendeeId: string;
  attendeeEmail: string;
  answer: string;
  createdAt: string;
}

const POLL_RESPONSES_SEED: PollResponse[] = [];

@Injectable()
export class PollResponsesRepository extends BaseRepository<PollResponse> {
  constructor() { super('poll-responses.json', POLL_RESPONSES_SEED); }
  findByPoll(pollId: string)             { return this.store.filter(r => r.pollId === pollId); }
  findByAttendee(attendeeId: string)     { return this.store.filter(r => r.attendeeId === attendeeId); }
  existsForPoll(pollId: string, email: string) {
    return this.store.some(r => r.pollId === pollId && r.attendeeEmail === email);
  }
  nextResponseId(): string { return this.nextId('pr'); }
}
