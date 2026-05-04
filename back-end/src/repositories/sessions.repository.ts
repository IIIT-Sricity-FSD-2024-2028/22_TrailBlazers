import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export interface Session {
  id: string;
  eventId: string;
  topic: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  location?: string;
  type?: string;
  createdAt: string;
}

const SESSIONS_SEED: Session[] = [];

@Injectable()
export class SessionsRepository extends BaseRepository<Session> {
  constructor() { super('sessions.json', SESSIONS_SEED); }
  findByEvent(eventId: string) { return this.store.filter(s => s.eventId === eventId); }
  nextSessionId(): string      { return this.nextId('s'); }
}
