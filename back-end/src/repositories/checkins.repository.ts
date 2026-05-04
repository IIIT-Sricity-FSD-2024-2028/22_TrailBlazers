import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export interface CheckIn {
  id: string;
  eventId: string;
  attendeeId: string;
  attendeeEmail: string;
  attendeeName: string;
  ticketCode: string;
  status: 'pending' | 'checked-in';
  checkInTime: string | null;
  createdAt: string;
}

const CHECKINS_SEED: CheckIn[] = [];

@Injectable()
export class CheckInsRepository extends BaseRepository<CheckIn> {
  constructor() { super('checkins.json', CHECKINS_SEED); }
  findByEvent(eventId: string)       { return this.store.filter(c => c.eventId === eventId); }
  findByAttendee(attendeeId: string) { return this.store.filter(c => c.attendeeId === attendeeId); }
  nextCheckInId(): string            { return this.nextId('ci'); }
}
