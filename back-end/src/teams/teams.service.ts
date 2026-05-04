import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  teamRole: 'Scanner Operator' | 'Coordinator' | 'Manager' | 'Support';
  eventId: string;
  status: 'active' | 'break' | 'offline';
  scansCompleted: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'teams.json');

@Injectable()
export class TeamsService {

  private readFile(): TeamMember[] {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as TeamMember[];
    } catch {
      return [];
    }
  }

  private writeFile(members: TeamMember[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2), 'utf-8');
  }

  private nextId(members: TeamMember[]): string {
    const nums = members
      .map((m) => parseInt(m.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `tm${max + 1}`;
  }

  findAll(eventId?: string, status?: string): TeamMember[] {
    let result = this.readFile();
    if (eventId) result = result.filter((m) => m.eventId === eventId);
    if (status) result = result.filter((m) => m.status === status);
    return result;
  }

  findOne(id: string): TeamMember {
    const member = this.readFile().find((m) => m.id === id);
    if (!member) throw new NotFoundException(`Team member "${id}" not found`);
    return member;
  }

  create(dto: any): TeamMember {
    const members = this.readFile();
    const newMember: TeamMember = {
      id: this.nextId(members),
      name: dto.name,
      email: dto.email,
      teamRole: dto.teamRole,
      eventId: dto.eventId,
      status: 'active',
      scansCompleted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    members.push(newMember);
    this.writeFile(members);
    return newMember;
  }

  update(id: string, dto: any): TeamMember {
    const members = this.readFile();
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) throw new NotFoundException(`Team member "${id}" not found`);
    members[index] = { ...members[index], ...dto, updatedAt: new Date().toISOString() };
    this.writeFile(members);
    return members[index];
  }

  remove(id: string): { message: string } {
    const members = this.readFile();
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) throw new NotFoundException(`Team member "${id}" not found`);
    members.splice(index, 1);
    this.writeFile(members);
    return { message: `Team member "${id}" removed` };
  }

  getStats(eventId: string): object {
    const members = this.readFile().filter((m) => m.eventId === eventId);
    return {
      total: members.length,
      active: members.filter((m) => m.status === 'active').length,
      onBreak: members.filter((m) => m.status === 'break').length,
      offline: members.filter((m) => m.status === 'offline').length,
      totalScans: members.reduce((sum, m) => sum + m.scansCompleted, 0),
    };
  }
}
