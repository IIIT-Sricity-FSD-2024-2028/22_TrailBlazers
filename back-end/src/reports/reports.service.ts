import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportsRepository } from '../repositories/reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  findAll(eventId?: string) {
    return eventId ? this.repo.findByEvent(eventId) : this.repo.findAll();
  }

  findOne(id: string) {
    const item = this.repo.findById(id);
    if (!item) throw new NotFoundException(`Report "${id}" not found`);
    return item;
  }

  findByEvent(eventId: string) {
    const items = this.repo.findByEvent(eventId);
    if (!items.length) throw new NotFoundException(`No report found for event "${eventId}"`);
    return items[0];
  }

  generate(dto: any) {
    const now = new Date().toISOString();
    return this.repo.save({
      id:                this.repo.nextReportId(),
      eventId:           dto.eventId,
      attendanceCount:   Number(dto.attendanceCount)   || 0,
      pollParticipation: Number(dto.pollParticipation) || 0,
      feedbackScore:     Number(dto.feedbackScore)     || 0,
      checkInRate:       Number(dto.checkInRate)       || 0,
      generatedAt:       now,
      createdAt:         now,
    });
  }

  update(id: string, dto: any) {
    this.findOne(id);
    return this.repo.update(id, dto)!;
  }

  remove(id: string) {
    this.findOne(id);
    this.repo.delete(id);
    return { message: `Report "${id}" deleted` };
  }
}
