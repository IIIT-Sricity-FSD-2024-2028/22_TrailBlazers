import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export type TeamMemberStatus = 'active'|'break'|'offline';
export interface TeamMember { id:string; name:string; email:string; teamRole:string; eventId:string; status:TeamMemberStatus; scansCompleted:number; createdAt:string; updatedAt:string; }

const TEAMS_SEED: TeamMember[] = [
  {id:'tm1',name:'Alex Thompson',email:'alex.t@wevents.com', teamRole:'Scanner Operator',eventId:'e1',status:'active', scansCompleted:48,createdAt:'2026-04-14T08:00:00.000Z',updatedAt:'2026-04-14T08:00:00.000Z'},
  {id:'tm2',name:'Sujith R',     email:'sujith.r@wevents.com',teamRole:'Coordinator',   eventId:'e1',status:'active', scansCompleted:32,createdAt:'2026-04-14T08:00:00.000Z',updatedAt:'2026-04-14T08:00:00.000Z'},
  {id:'tm3',name:'Vipul Mehta',  email:'vipul.m@wevents.com', teamRole:'Support',        eventId:'e4',status:'break',  scansCompleted:15,createdAt:'2026-04-20T08:00:00.000Z',updatedAt:'2026-04-24T08:00:00.000Z'},
  {id:'tm4',name:'Siddu Kumar',  email:'siddu.k@wevents.com', teamRole:'Scanner Operator',eventId:'e4',status:'active',scansCompleted:60,createdAt:'2026-04-20T08:00:00.000Z',updatedAt:'2026-04-24T08:00:00.000Z'},
  {id:'tm5',name:'Neha Verma',   email:'neha.v@wevents.com',  teamRole:'Manager',        eventId:'e5',status:'active', scansCompleted:0, createdAt:'2026-05-01T08:00:00.000Z',updatedAt:'2026-05-01T08:00:00.000Z'},
  {id:'tm6',name:'Rohit Das',    email:'rohit.d@wevents.com', teamRole:'Support',        eventId:'e2',status:'offline',scansCompleted:80,createdAt:'2026-03-18T08:00:00.000Z',updatedAt:'2026-03-21T08:00:00.000Z'},
];

@Injectable()
export class TeamsRepository extends BaseRepository<TeamMember> {
  constructor() { super('teams.json', TEAMS_SEED); }
  findByEventId(eventId: string): TeamMember[] { return this.store.filter(m => m.eventId===eventId); }
  findActiveByEventId(eventId: string): TeamMember[] { return this.store.filter(m => m.eventId===eventId && m.status==='active'); }
  findByEmail(email: string): TeamMember|undefined { return this.store.find(m => m.email.toLowerCase()===email.toLowerCase()); }
  incrementScans(memberId: string): TeamMember|null {
    const m = this.store.find(m => m.id===memberId);
    if (!m) return null;
    m.scansCompleted++; m.updatedAt = new Date().toISOString();
    return m;
  }
  nextMemberId(): string { return this.nextId('tm'); }
}

