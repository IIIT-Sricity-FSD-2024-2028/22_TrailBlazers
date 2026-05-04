import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

export interface PendingRequest { id:string; [key:string]:any; createdAt:string; updatedAt:string; }

const PENDING_REQUESTS_SEED: PendingRequest[] = [
  {id:'pr1',name:'Tech Innovation Summit 2026',      location:'Pune, Maharashtra',    expected:500, client:'Priya Sharma', clientEmail:'priya.s@techcorp.com', date:'2026-07-15',description:'Annual technology conference featuring AI and blockchain workshops',type:'In-Person',status:'Approved',managerId:'u5',managerName:'Kavya Iyer',createdAt:'2026-04-10T08:00:00.000Z',updatedAt:'2026-05-03T13:54:34.748Z'},
  {id:'pr2',name:'Healthcare Leadership Forum',      location:'Chennai, Tamil Nadu',  expected:200, client:'Amit Gupta',   clientEmail:'amit.g@healthtech.com', date:'2026-07-22',description:'Forum for healthcare industry leaders',type:'In-Person',status:'Approved',managerId:'u5',managerName:'Kavya Iyer',createdAt:'2026-04-12T08:00:00.000Z',updatedAt:'2026-05-03T13:54:47.180Z'},
  {id:'pr3',name:'EdTech Expo India 2026',           location:'Virtual',              expected:1500,client:'Ritu Sharma',  clientEmail:'ritu@gmail.com',        date:'2026-08-10',description:'Virtual expo showcasing education technology',type:'In-Person',status:'Approved',managerId:'u2',managerName:'Rajesh Kumar',createdAt:'2026-04-05T08:00:00.000Z',updatedAt:'2026-04-14T08:00:00.000Z'},
  {id:'pr4',name:'Real Estate Investment Conclave',  location:'Bengaluru, Karnataka', expected:300, client:'Sanjay Reddy', clientEmail:'sanjay.r@realty.com',   date:'2026-06-01',description:'Conclave for real estate developers and investors',type:'In-Person',status:'Rejected',rejectionReason:'Venue not available on the requested date',createdAt:'2026-03-28T08:00:00.000Z',updatedAt:'2026-04-02T08:00:00.000Z'},
  {id:'pr5',name:'Women in Leadership Summit',       location:'Hyderabad, Telangana', expected:400, client:'Kavya Iyer',   clientEmail:'kavya@gmail.com',       date:'2026-09-05',description:'Summit empowering women professionals',type:'In-Person',status:'Rejected',rejectionReason:'Not approved at this time.',createdAt:'2026-04-20T08:00:00.000Z',updatedAt:'2026-05-03T14:02:49.096Z'},
  {id:'pr6',name:'Digital Marketing Expo',           location:'Taj Hotel, Mumbai',    expected:500, client:'sidduvanam',   clientEmail:'siddu@gmail.com',clientId:'u17',eventId:'e8',date:'2026-05-05',description:'hgs',type:'In-Person',status:'Rejected',rejectionReason:'full',createdAt:'2026-05-03T13:44:13.964Z',updatedAt:'2026-05-03T14:02:44.760Z'},
];

@Injectable()
export class PendingRequestsRepository extends BaseRepository<PendingRequest> {
  constructor() { super('pending-requests.json', PENDING_REQUESTS_SEED); }
  findPending(): PendingRequest[]              { return this.store.filter(r => r.status==='Pending'||r.status==='pending'); }
  findByEventId(eventId: string): PendingRequest[] { return this.store.filter(r => r.eventId===eventId); }
  findByClientId(clientId: string): PendingRequest[] { return this.store.filter(r => r.clientId===clientId); }
  findFiltered(status?: string, clientId?: string): PendingRequest[] {
    return this.store.filter(r => {
      if (status   && r.status   !== status)   return false;
      if (clientId && r.clientId !== clientId) return false;
      return true;
    });
  }
  nextRequestId(): string { return this.nextId('pr'); }
}

