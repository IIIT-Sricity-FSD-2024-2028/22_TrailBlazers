import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RsvpsRepository } from '../repositories/rsvps.repository';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class RsvpsService {
  constructor(
    private readonly repo:      RsvpsRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  private validateEmail(email: string, requiredRole?: string): void {
    const user = this.usersRepo.findByEmail(email);
    if (!user) throw new BadRequestException(`Email "${email}" is not registered in the system`);
    if (requiredRole && user.role !== requiredRole)
      throw new BadRequestException(`Email "${email}" is not registered as an ${requiredRole}`);
  }

  findAll(eventId?: string, status?: string) {
    return this.repo.store.filter(r => {
      if (eventId && r.eventId !== eventId) return false;
      if (status  && r.status  !== status)  return false;
      return true;
    });
  }

  findOne(id: string) {
    const rsvp = this.repo.findById(id);
    if (!rsvp) throw new NotFoundException(`RSVP "${id}" not found`);
    return rsvp;
  }

  findByEmail(email: string) {
    this.validateEmail(email, 'attendee');
    return this.repo.findByEmail(email);
  }

  create(dto: any) {
    this.validateEmail(dto.email, 'attendee');
    if (this.repo.existsForEvent(dto.eventId, dto.email))
      throw new ConflictException(`${dto.email} has already registered for this event`);

    return this.repo.save({
      id:         this.repo.nextRsvpId(),
      eventId:    dto.eventId,
      name:       dto.name,
      email:      dto.email,
      phone:      dto.phone,
      status:     'confirmed',
      ticketCode: this.repo.nextTicketCode(),
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    });
  }

  update(id: string, dto: any) {
    const rsvp = this.findOne(id);
    return this.repo.update(id, { ...dto, updatedAt: new Date().toISOString() })!;
  }

  remove(id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`RSVP "${id}" not found`);
    this.repo.delete(id);
    return { message: `RSVP "${id}" cancelled` };
  }

  checkIn(ticketCode: string) {
    const rsvp = this.repo.findByTicketCode(ticketCode);
    if (!rsvp) throw new NotFoundException(`Ticket "${ticketCode}" not found`);
    if (rsvp.status === 'attended') throw new ConflictException(`Ticket "${ticketCode}" already checked in`);
    return this.repo.update(rsvp.id, { status: 'attended', updatedAt: new Date().toISOString() })!;
  }
}
