import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CheckInsRepository } from '../repositories/checkins.repository';

@Injectable()
export class CheckInsService {
  constructor(private readonly repo: CheckInsRepository) {}

  findAll(eventId?: string, attendeeId?: string) {
    return this.repo.store.filter(c => {
      if (eventId    && c.eventId    !== eventId)    return false;
      if (attendeeId && c.attendeeId !== attendeeId) return false;
      return true;
    });
  }

  findOne(id: string) {
    const item = this.repo.findById(id);
    if (!item) throw new NotFoundException(`Check-in "${id}" not found`);
    return item;
  }

  create(dto: any) {
    const id = this.repo.nextCheckInId();
    const isCheckedIn = dto.status === 'checked-in';
    return this.repo.save({
      id,
      eventId:       dto.eventId,
      attendeeId:    dto.attendeeId,
      attendeeEmail: dto.attendeeEmail,
      attendeeName:  dto.attendeeName,
      ticketCode:    dto.ticketCode,
      status:        isCheckedIn ? 'checked-in' : 'pending',
      checkInTime:   isCheckedIn ? new Date().toISOString() : null,
      createdAt:     new Date().toISOString(),
    });
  }

  checkIn(id: string) {
    const item = this.findOne(id);
    if (item.status === 'checked-in')
      throw new ConflictException(`Check-in "${id}" already completed`);
    return this.repo.update(id, {
      status:      'checked-in',
      checkInTime: new Date().toISOString(),
    })!;
  }

  remove(id: string) {
    this.findOne(id);
    this.repo.delete(id);
    return { message: `Check-in "${id}" deleted` };
  }
}
