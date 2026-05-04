import { Injectable } from '@nestjs/common';

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

@Injectable()
export class RsvpsRepository {
  private rsvps: Rsvp[] = [
    { id: 'r1', eventId: 'e1', name: 'Rahul Sharma', email: 'rahul.s@gmail.com', phone: '9876543210', status: 'confirmed', ticketCode: 'TKT00001', createdAt: '2026-04-01T10:00:00.000Z', updatedAt: '2026-04-01T10:00:00.000Z' },
    { id: 'r2', eventId: 'e1', name: 'Priya Patel', email: 'priya.p@gmail.com', phone: '8765432101', status: 'confirmed', ticketCode: 'TKT00002', createdAt: '2026-04-02T10:00:00.000Z', updatedAt: '2026-04-02T10:00:00.000Z' },
    { id: 'r3', eventId: 'e4', name: 'Vikram Singh', email: 'vikram.s@gmail.com', phone: '7654321012', status: 'attended', ticketCode: 'TKT00003', createdAt: '2026-04-10T10:00:00.000Z', updatedAt: '2026-04-24T09:30:00.000Z' },
    { id: 'r4', eventId: 'e2', name: 'Ananya Roy', email: 'ananya.r@gmail.com', phone: '9123456789', status: 'attended', ticketCode: 'TKT00004', createdAt: '2026-03-10T09:00:00.000Z', updatedAt: '2026-03-20T10:00:00.000Z' },
    { id: 'r5', eventId: 'e5', name: 'Siddharth Nair', email: 'sid.n@gmail.com', phone: '9988776655', status: 'confirmed', ticketCode: 'TKT00005', createdAt: '2026-05-01T08:00:00.000Z', updatedAt: '2026-05-01T08:00:00.000Z' },
    { id: 'r6', eventId: 'e1', name: 'Meera Krishnan', email: 'meera.k@gmail.com', phone: '8899776644', status: 'cancelled', ticketCode: 'TKT00006', createdAt: '2026-04-03T11:00:00.000Z', updatedAt: '2026-04-05T11:00:00.000Z' },
  ];

  private nextId(): string {
    const nums = this.rsvps.map((r) => parseInt(r.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    return `r${(nums.length ? Math.max(...nums) : 0) + 1}`;
  }

  private nextTicketCode(): string {
    const nums = this.rsvps.map((r) => parseInt(r.ticketCode.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    return `TKT${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(5, '0')}`;
  }

  findAll(eventId?: string, status?: string): Rsvp[] {
    let result = [...this.rsvps];
    if (eventId) result = result.filter((r) => r.eventId === eventId);
    if (status) result = result.filter((r) => r.status === status);
    return result;
  }

  findById(id: string): Rsvp | undefined {
    return this.rsvps.find((r) => r.id === id);
  }

  findByTicket(ticketCode: string): Rsvp | undefined {
    return this.rsvps.find((r) => r.ticketCode === ticketCode);
  }

  findByEmail(email: string): Rsvp[] {
    return this.rsvps.filter((r) => r.email === email);
  }

  existsForEvent(eventId: string, email: string): boolean {
    return this.rsvps.some((r) => r.eventId === eventId && r.email === email);
  }

  create(data: Pick<Rsvp, 'eventId' | 'name' | 'email' | 'phone'>): Rsvp {
    const newRsvp: Rsvp = {
      id: this.nextId(),
      ...data,
      status: 'confirmed',
      ticketCode: this.nextTicketCode(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.rsvps.push(newRsvp);
    return newRsvp;
  }

  update(id: string, data: Partial<Rsvp>): Rsvp | undefined {
    const index = this.rsvps.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    this.rsvps[index] = { ...this.rsvps[index], ...data, updatedAt: new Date().toISOString() };
    return this.rsvps[index];
  }

  delete(id: string): boolean {
    const index = this.rsvps.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.rsvps.splice(index, 1);
    return true;
  }
}
