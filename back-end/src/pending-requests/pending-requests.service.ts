import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PendingRequestsRepository } from '../repositories/pending-requests.repository';
import { EventsRepository }          from '../repositories/events.repository';

@Injectable()
export class PendingRequestsService {
  constructor(
    private readonly repo:       PendingRequestsRepository,
    private readonly eventsRepo: EventsRepository,
  ) {}

  findAll(status?: string) {
    return status ? this.repo.store.filter(r => r.status === status) : this.repo.store;
  }

  findByClient(clientEmail: string) {
    return this.repo.store.filter(r => r.clientEmail === clientEmail);
  }

  findOne(id: string) {
    const req = this.repo.findById(id);
    if (!req) throw new NotFoundException(`Request "${id}" not found`);
    return req;
  }

  create(dto: any) {
    return this.repo.save({
      id:        this.repo.nextRequestId(),
      ...dto,
      status:    'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  review(id: string, dto: any) {
    const req = this.findOne(id);
    if (req.status !== 'Pending')
      throw new BadRequestException(`Request "${id}" has already been reviewed`);

    if (dto.decision === 'approved') {
      if (!dto.managerId) throw new BadRequestException('managerId is required for approval');
      this.repo.update(id, {
        status:      'Approved',
        managerId:   dto.managerId,
        managerName: dto.managerName,
        updatedAt:   new Date().toISOString(),
      });
      // Update linked event to 'upcoming'
      if (req.eventId) {
        this.eventsRepo.update(req.eventId, {
          status:      'upcoming',
          managerId:   dto.managerId,
          managerName: dto.managerName || undefined,
          updatedAt:   new Date().toISOString(),
        });
      }
    } else {
      this.repo.update(id, {
        status:          'Rejected',
        rejectionReason: dto.rejectionReason || 'No reason provided',
        updatedAt:       new Date().toISOString(),
      });
      // Mark linked event as rejected
      if (req.eventId) {
        this.eventsRepo.update(req.eventId, { status: 'rejected', updatedAt: new Date().toISOString() });
      }
    }
    return this.repo.findById(id)!;
  }

  remove(id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Request "${id}" not found`);
    this.repo.delete(id);
    return { message: `Request "${id}" deleted` };
  }
}
