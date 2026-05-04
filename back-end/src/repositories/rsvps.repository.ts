import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export type RsvpStatus = 'pending'|'confirmed'|'cancelled'|'attended';
export interface Rsvp { id:string; eventId:string; name:string; email:string; phone:string; status:RsvpStatus; ticketCode:string; createdAt:string; updatedAt:string; }

const RSVPS_SEED: Rsvp[] = [
  {id:'r3',  eventId:'e4', name:'Vikram Singh',   email:'vikram.s@gmail.com',     phone:'7654321012', status:'attended',  ticketCode:'TKT00003', createdAt:'2026-04-10T10:00:00.000Z', updatedAt:'2026-04-24T09:30:00.000Z'},
  {id:'r4',  eventId:'e2', name:'Ananya Roy',     email:'ananya.r@gmail.com',      phone:'9123456789', status:'attended',  ticketCode:'TKT00004', createdAt:'2026-03-10T09:00:00.000Z', updatedAt:'2026-03-20T10:00:00.000Z'},
  {id:'r6',  eventId:'e1', name:'Meera Krishnan', email:'meera.k@gmail.com',       phone:'8899776644', status:'cancelled', ticketCode:'TKT00006', createdAt:'2026-04-03T11:00:00.000Z', updatedAt:'2026-04-05T11:00:00.000Z'},
  {id:'r7',  eventId:'e1', name:'Rahul Sharma',   email:'rahul.sharma@gmail.com',  phone:'9876543210', status:'confirmed', ticketCode:'TKT00007', createdAt:'2026-05-03T06:13:55.117Z', updatedAt:'2026-05-03T06:13:55.117Z'},
  {id:'r8',  eventId:'e1', name:'Siddu',          email:'new.email@gmail.com',     phone:'9876543106', status:'pending',   ticketCode:'TKT00008', createdAt:'2026-05-03T06:27:15.722Z', updatedAt:'2026-05-03T09:49:04.831Z'},
  {id:'r9',  eventId:'e2', name:'Rahul Sharma',   email:'new.email@gmail.com',     phone:'9876543210', status:'pending',   ticketCode:'TKT00009', createdAt:'2026-05-03T09:46:52.792Z', updatedAt:'2026-05-03T09:48:00.938Z'},
  {id:'r10', eventId:'e3', name:'Rahul Sharma',   email:'rahul.sharma@gmail.com',  phone:'9989193656', status:'confirmed', ticketCode:'TKT00010', createdAt:'2026-05-03T19:51:53.577Z', updatedAt:'2026-05-03T19:51:53.577Z'},
  {id:'r11', eventId:'e5', name:'Rahul Sharma',   email:'rahul.sharma@gmail.com',  phone:'9989193656', status:'confirmed', ticketCode:'TKT00011', createdAt:'2026-05-03T19:52:25.102Z', updatedAt:'2026-05-03T19:52:25.102Z'},
  {id:'r12', eventId:'e3', name:'sai',            email:'sai@gmail.com',           phone:'9989193656', status:'confirmed', ticketCode:'TKT00012', createdAt:'2026-05-03T20:00:57.708Z', updatedAt:'2026-05-03T20:00:57.708Z'},
];

@Injectable()
export class RsvpsRepository extends BaseRepository<Rsvp> {
  constructor() { super('rsvps.json', RSVPS_SEED); }
  findByEventId(eventId: string): Rsvp[]     { return this.store.filter(r => r.eventId===eventId); }
  findByEmail(email: string): Rsvp[]         { return this.store.filter(r => r.email.toLowerCase()===email.toLowerCase()); }
  findByTicketCode(tc: string): Rsvp|undefined { return this.store.find(r => r.ticketCode===tc); }
  existsForEvent(eventId: string, email: string): boolean {
    return this.store.some(r => r.eventId===eventId && r.email.toLowerCase()===email.toLowerCase() && r.status!=='cancelled');
  }
  findFiltered(eventId?: string, status?: string): Rsvp[] {
    return this.store.filter(r => {
      if (eventId && r.eventId !== eventId) return false;
      if (status  && r.status  !== status)  return false;
      return true;
    });
  }
  nextRsvpId(): string { return this.nextId('r'); }
  nextTicketCode(): string {
    const nums = this.store.map(r => parseInt(r.ticketCode?.replace(/\D/g,'')||'0',10)).filter(n => !isNaN(n));
    return `TKT${String((nums.length?Math.max(...nums):0)+1).padStart(5,'0')}`;
  }
}

