import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Rsvp {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  ticketCode: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'rsvps.json');

@Injectable()
export class RsvpsService {

  private readFile(): Rsvp[] {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Rsvp[];
    } catch {
      return [];
    }
  }

  private writeFile(rsvps: Rsvp[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(rsvps, null, 2), 'utf-8');
  }

  private nextId(rsvps: Rsvp[]): string {
    const nums = rsvps
      .map((r) => parseInt(r.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `r${max + 1}`;
  }

  private nextTicketCode(rsvps: Rsvp[]): string {
    const nums = rsvps
      .map((r) => parseInt(r.ticketCode.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `TKT${String(max + 1).padStart(5, '0')}`;
  }

  findAll(eventId?: string, status?: string): Rsvp[] {
    let result = this.readFile();
    if (eventId) result = result.filter((r) => r.eventId === eventId);
    if (status) result = result.filter((r) => r.status === status);
    return result;
  }

  findOne(id: string): Rsvp {
    const rsvp = this.readFile().find((r) => r.id === id);
    if (!rsvp) throw new NotFoundException(`RSVP "${id}" not found`);
    return rsvp;
  }

  findByEmail(email: string): Rsvp[] {
    return this.readFile().filter((r) => r.email === email);
  }

  create(dto: any): Rsvp {
    const rsvps = this.readFile();
    const existing = rsvps.find((r) => r.eventId === dto.eventId && r.email === dto.email);
    if (existing) throw new ConflictException(`${dto.email} has already registered for this event`);

    const newRsvp: Rsvp = {
      id: this.nextId(rsvps),
      eventId: dto.eventId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      status: 'confirmed',
      ticketCode: this.nextTicketCode(rsvps),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    rsvps.push(newRsvp);
    this.writeFile(rsvps);
    return newRsvp;
  }

  update(id: string, dto: any): Rsvp {
    const rsvps = this.readFile();
    const index = rsvps.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException(`RSVP "${id}" not found`);
    rsvps[index] = { ...rsvps[index], ...dto, updatedAt: new Date().toISOString() };
    this.writeFile(rsvps);
    return rsvps[index];
  }

  remove(id: string): { message: string } {
    const rsvps = this.readFile();
    const index = rsvps.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException(`RSVP "${id}" not found`);
    rsvps.splice(index, 1);
    this.writeFile(rsvps);
    return { message: `RSVP "${id}" cancelled` };
  }

  checkIn(ticketCode: string): Rsvp {
    const rsvps = this.readFile();
    const rsvp = rsvps.find((r) => r.ticketCode === ticketCode);
    if (!rsvp) throw new NotFoundException(`Ticket "${ticketCode}" not found`);
    if (rsvp.status === 'attended') {
      throw new ConflictException(`Ticket "${ticketCode}" already checked in`);
    }
    rsvp.status = 'attended';
    rsvp.updatedAt = new Date().toISOString();
    this.writeFile(rsvps);
    return rsvp;
  }
}
