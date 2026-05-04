import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TeamsRepository }  from '../repositories/teams.repository';
import { UsersRepository }  from '../repositories/users.repository';

@Injectable()
export class TeamsService {
  constructor(
    private readonly repo:      TeamsRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  private validateOscEmail(email: string): void {
    const user = this.usersRepo.findByEmail(email);
    if (!user) throw new BadRequestException(`Email "${email}" is not registered`);
    if (user.role !== 'osc') throw new BadRequestException(`Email "${email}" does not belong to an OSC user`);
  }

  findAll(eventId?: string, status?: string) {
    return this.repo.store.filter(m => {
      if (eventId && m.eventId !== eventId) return false;
      if (status  && m.status  !== status)  return false;
      return true;
    });
  }

  findOne(id: string) {
    const m = this.repo.findById(id);
    if (!m) throw new NotFoundException(`Team member "${id}" not found`);
    return m;
  }

  create(dto: any) {
    this.validateOscEmail(dto.email);
    return this.repo.save({
      id:             this.repo.nextMemberId(),
      name:           dto.name,
      email:          dto.email,
      teamRole:       dto.teamRole,
      eventId:        dto.eventId,
      status:         'active',
      scansCompleted: 0,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    });
  }

  update(id: string, dto: any) {
    this.findOne(id);
    return this.repo.update(id, { ...dto, updatedAt: new Date().toISOString() })!;
  }

  remove(id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Team member "${id}" not found`);
    this.repo.delete(id);
    return { message: `Team member "${id}" removed` };
  }

  getStats(eventId: string) {
    const members = this.repo.store.filter(m => m.eventId === eventId);
    return {
      total:      members.length,
      active:     members.filter(m => m.status === 'active').length,
      onBreak:    members.filter(m => m.status === 'break').length,
      offline:    members.filter(m => m.status === 'offline').length,
      totalScans: members.reduce((s, m) => s + m.scansCompleted, 0),
    };
  }
}
