import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  findAll(role?: string) {
    return role ? this.repo.store.filter(u => u.role === role) : this.repo.store;
  }

  findOne(id: string) {
    const user = this.repo.findById(id);
    if (!user) throw new NotFoundException(`User "${id}" not found`);
    return user;
  }

  create(dto: any) {
    if (this.repo.findByEmail(dto.email))
      throw new ConflictException(`Email "${dto.email}" already registered`);
    return this.repo.save({
      id:        this.repo.nextUserId(),
      name:      dto.name,
      email:     dto.email,
      role:      dto.role,
      domain:    dto.domain,
      status:    'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  update(id: string, dto: any) {
    const user = this.findOne(id);
    return this.repo.update(id, { ...dto, updatedAt: new Date().toISOString() })!;
  }

  remove(id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`User "${id}" not found`);
    this.repo.delete(id);
    return { message: `User "${id}" deleted` };
  }

  getStats() {
    const u = this.repo.store;
    return {
      total:         u.length,
      superusers:    u.filter(x => x.role === 'superuser').length,
      eventManagers: u.filter(x => x.role === 'eventmanager').length,
      clients:       u.filter(x => x.role === 'client').length,
      oscStaff:      u.filter(x => x.role === 'osc').length,
      attendees:     u.filter(x => x.role === 'attendee').length,
      active:        u.filter(x => x.status === 'active').length,
    };
  }
}
