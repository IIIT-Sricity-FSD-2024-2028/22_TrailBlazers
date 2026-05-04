import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export interface Report {
  id: string;
  eventId: string;
  attendanceCount: number;
  pollParticipation: number;
  feedbackScore: number;
  checkInRate: number;
  generatedAt: string;
  createdAt: string;
}

const REPORTS_SEED: Report[] = [];

@Injectable()
export class ReportsRepository extends BaseRepository<Report> {
  constructor() { super('reports.json', REPORTS_SEED); }
  findByEvent(eventId: string) { return this.store.filter(r => r.eventId === eventId); }
  nextReportId(): string       { return this.nextId('rp'); }
}
