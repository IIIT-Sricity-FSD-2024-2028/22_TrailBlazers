import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionsRepository } from '../repositories/sessions.repository';

@Injectable()
export class SessionsService {
  constructor(private readonly repo: SessionsRepository) {}

  findAll(eventId?: string) {
    return eventId ? this.repo.findByEvent(eventId) : this.repo.findAll();
  }

  findOne(id: string) {
    const item = this.repo.findById(id);
    if (!item) throw new NotFoundException(`Session "${id}" not found`);
    return item;
  }

  create(dto: any) {
    return this.repo.save({
      id:        this.repo.nextSessionId(),
      eventId:   dto.eventId,
      topic:     dto.topic,
      startTime: dto.startTime,
      endTime:   dto.endTime,
      speaker:   dto.speaker || '',
      location:  dto.location || '',
      type:      dto.type || 'talk',
      createdAt: new Date().toISOString(),
    });
  }

  update(id: string, dto: any) {
    this.findOne(id);
    return this.repo.update(id, dto)!;
  }

  remove(id: string) {
    this.findOne(id);
    this.repo.delete(id);
    return { message: `Session "${id}" deleted` };
  }
}
