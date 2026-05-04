import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export type UserRole = 'superuser'|'client'|'eventmanager'|'attendee'|'osc';
export interface User { id:string; name:string; email:string; role:UserRole; domain?:string; status:'active'|'inactive'|'suspended'; createdAt:string; updatedAt:string; }

const USERS_SEED: User[] = [
  {id:'u1',  name:'Admin Root',     email:'admin@gmail.com',         role:'superuser',    domain:'Platform Administration',    status:'active', createdAt:'2026-01-01T00:00:00.000Z', updatedAt:'2026-01-01T00:00:00.000Z'},
  {id:'u2',  name:'Rajesh Kumar',   email:'rajesh@gmail.com',         role:'client',       domain:'Tech Conferences',           status:'active', createdAt:'2026-01-05T00:00:00.000Z', updatedAt:'2026-01-05T00:00:00.000Z'},
  {id:'u3',  name:'Priya Sharma',   email:'priya.s@gmail.com',        role:'client',       domain:'Healthcare & Life Sciences', status:'active', createdAt:'2026-01-06T00:00:00.000Z', updatedAt:'2026-01-06T00:00:00.000Z'},
  {id:'u4',  name:'Arjun Bose',     email:'arjun.b@gmail.com',        role:'client',       domain:'Fintech & Banking',          status:'active', createdAt:'2026-01-07T00:00:00.000Z', updatedAt:'2026-01-07T00:00:00.000Z'},
  {id:'u5',  name:'Kavya Iyer',     email:'kavya.i@gmail.com',        role:'eventmanager', domain:'Tech Conferences',           status:'active', createdAt:'2026-01-10T00:00:00.000Z', updatedAt:'2026-01-10T00:00:00.000Z'},
  {id:'u6',  name:'Arjun Mehta',    email:'arjun.m@gmail.com',        role:'eventmanager', domain:'Healthcare & Life Sciences', status:'active', createdAt:'2026-01-11T00:00:00.000Z', updatedAt:'2026-01-11T00:00:00.000Z'},
  {id:'u7',  name:'Rahul Sharma',   email:'rahul.sharma@gmail.com',   role:'attendee',     domain:'General',                   status:'active', createdAt:'2026-01-15T00:00:00.000Z', updatedAt:'2026-01-15T00:00:00.000Z'},
  {id:'u8',  name:'Ananya Reddy',   email:'ananya.r@gmail.com',       role:'attendee',     domain:'General',                   status:'active', createdAt:'2026-01-16T00:00:00.000Z', updatedAt:'2026-01-16T00:00:00.000Z'},
  {id:'u9',  name:'Meera Krishnan', email:'meera.k@gmail.com',        role:'attendee',     domain:'General',                   status:'active', createdAt:'2026-01-17T00:00:00.000Z', updatedAt:'2026-01-17T00:00:00.000Z'},
  {id:'u10', name:'Vikram Singh',   email:'vikram.s@gmail.com',       role:'attendee',     domain:'General',                   status:'active', createdAt:'2026-01-18T00:00:00.000Z', updatedAt:'2026-01-18T00:00:00.000Z'},
  {id:'u11', name:'Neha Joshi',     email:'neha.j@gmail.com',         role:'attendee',     domain:'General',                   status:'active', createdAt:'2026-01-19T00:00:00.000Z', updatedAt:'2026-01-19T00:00:00.000Z'},
  {id:'u12', name:'Alex Thompson',  email:'alex.t@gmail.com',         role:'osc',          domain:'Tech Conferences',          status:'active', createdAt:'2026-01-20T00:00:00.000Z', updatedAt:'2026-01-20T00:00:00.000Z'},
  {id:'u13', name:'Sujith Rajan',   email:'sujith.r@gmail.com',       role:'osc',          domain:'Healthcare & Life Sciences', status:'active', createdAt:'2026-01-20T00:00:00.000Z', updatedAt:'2026-01-20T00:00:00.000Z'},
  {id:'u14', name:'Deepa Nair',     email:'deepa.n@gmail.com',        role:'osc',          domain:'Fintech & Banking',          status:'active', createdAt:'2026-01-20T00:00:00.000Z', updatedAt:'2026-01-20T00:00:00.000Z'},
  {id:'u15', name:'Kiran Rao',      email:'kiran.r@gmail.com',        role:'osc',          domain:'Tech Conferences',          status:'active', createdAt:'2026-01-21T00:00:00.000Z', updatedAt:'2026-01-21T00:00:00.000Z'},
  {id:'u16', name:'Pooja Verma',    email:'pooja.v@gmail.com',        role:'osc',          domain:'Fintech & Banking',          status:'active', createdAt:'2026-01-21T00:00:00.000Z', updatedAt:'2026-01-21T00:00:00.000Z'},
  {id:'u17', name:'sidduvanam',     email:'siddu@gmail.com',          role:'client',       domain:'Client Hosted Events',      status:'active', createdAt:'2026-05-03T13:30:32.233Z', updatedAt:'2026-05-03T13:30:32.233Z'},
  {id:'u18', name:'sai',            email:'sai@gmail.com',            role:'attendee',     domain:'General',                   status:'active', createdAt:'2026-05-03T15:31:14.307Z', updatedAt:'2026-05-03T15:31:14.307Z'},
];

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor() { super('users.json', USERS_SEED); }
  findByEmail(email: string): User|undefined { return this.store.find(u => u.email.toLowerCase()===email.toLowerCase()); }
  findByRole(role: UserRole): User[] { return this.store.filter(u => u.role===role); }
  findFiltered(role?: string, status?: string): User[] {
    return this.store.filter(u => {
      if (role   && u.role   !== role)   return false;
      if (status && u.status !== status) return false;
      return true;
    });
  }
  nextUserId(): string { return this.nextId('u'); }
}

