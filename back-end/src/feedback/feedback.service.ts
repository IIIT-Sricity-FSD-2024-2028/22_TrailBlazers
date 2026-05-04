import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Injectable()
export class FeedbackService {
  constructor(private readonly repo: FeedbackRepository) {}

  findAll(eventId?: string, attendeeId?: string) {
    return this.repo.store.filter(f => {
      if (eventId    && f.eventId    !== eventId)    return false;
      if (attendeeId && f.attendeeId !== attendeeId) return false;
      return true;
    });
  }

  findOne(id: string) {
    const item = this.repo.findById(id);
    if (!item) throw new NotFoundException(`Feedback "${id}" not found`);
    return item;
  }

  avgRating(eventId: string) {
    return { eventId, avgRating: this.repo.avgRating(eventId) };
  }

  create(dto: any) {
    if (dto.rating < 1 || dto.rating > 5)
      throw new ConflictException('Rating must be between 1 and 5');
    const id = this.repo.nextFeedbackId();
    const now = new Date().toISOString();
    return this.repo.save({
      id,
      eventId:       dto.eventId,
      attendeeId:    dto.attendeeId,
      attendeeEmail: dto.attendeeEmail,
      rating:        Number(dto.rating),
      comment:       dto.comment || '',
      date:          now,
      createdAt:     now,
    });
  }

  update(id: string, dto: any) {
    this.findOne(id);
    return this.repo.update(id, dto)!;
  }

  remove(id: string) {
    this.findOne(id);
    this.repo.delete(id);
    return { message: `Feedback "${id}" deleted` };
  }
}
