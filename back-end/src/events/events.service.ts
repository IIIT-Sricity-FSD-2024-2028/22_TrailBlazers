import { Injectable, NotFoundException } from '@nestjs/common';
import { EventsRepository } from '../repositories/events.repository';

@Injectable()
export class EventsService {
  constructor(private readonly repo: EventsRepository) {}

  findAll(status?: string, managerId?: string, clientId?: string) {
    const validStatuses = ['pending', 'upcoming', 'live', 'completed', 'rejected'];
    return this.repo.store.filter(e => {
      if (status && validStatuses.includes(status) && e.status !== status) return false;
      if (managerId && /^u\d+$/.test(managerId) && e.managerId !== managerId) return false;
      if (clientId  && /^u\d+$/.test(clientId)  && (e as any).clientId !== clientId) return false;
      return true;
    });
  }

  findOne(id: string) {
    const ev = this.repo.findById(id);
    if (!ev) throw new NotFoundException(`Event "${id}" not found`);
    return ev;
  }

  create(dto: any) {
    const timeline = dto.timeline || [];
    const uniqueSpeakers = new Set(timeline.map((s: any) => s.speaker)).size;
    const newEvent: any = {
      id:          this.repo.nextEventId(),
      title:       dto.title,
      status:      dto.status || 'pending',
      date:        dto.date,
      location:    dto.location,
      capacity:    dto.capacity,
      domain:      dto.domain,
      description: dto.description,
      managerId:   dto.managerId   || null,
      managerName: dto.managerName || null,
      clientId:    dto.clientId    || null,
      clientEmail: dto.clientEmail || null,
      clientName:  dto.clientName  || null,
      attendees:   0,
      sessions:    timeline.length,
      speakers:    uniqueSpeakers,
      timeline,
      stats:       dto.stats || { rsvps:0, checkins:0, engagement:0, rating:0, participationTrend:[], feedbackScore:0 },
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };
    return this.repo.save(newEvent);
  }

  update(id: string, dto: any) {
    const existing = this.findOne(id);
    const timeline = dto.timeline !== undefined ? dto.timeline : existing.timeline;
    const uniqueSpeakers = timeline ? new Set(timeline.map((s: any) => s.speaker)).size : existing.speakers;
    const updated = this.repo.update(id, {
      ...dto,
      sessions:  timeline ? timeline.length : existing.sessions,
      speakers:  uniqueSpeakers,
      timeline,
      updatedAt: new Date().toISOString(),
    });
    return updated!;
  }

  remove(id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Event "${id}" not found`);
    this.repo.delete(id);
    return { message: `Event "${id}" deleted successfully` };
  }

  getDashboardStats(managerId?: string) {
    const events = managerId
      ? this.repo.store.filter(e => e.managerId === managerId)
      : this.repo.store;
    const active    = events.filter(e => e.status === 'live' || e.status === 'upcoming');
    const completed = events.filter(e => e.status === 'completed');
    let totalRSVPs = 0, ratingSum = 0, engagementSum = 0, ratingCount = 0;
    events.forEach(e => {
      if (e.stats) {
        totalRSVPs += e.stats.rsvps || 0;
        if (e.stats.rating) { ratingCount++; ratingSum += e.stats.rating; engagementSum += e.stats.engagement || 0; }
      }
    });
    return {
      totalEvents: events.length, activeEventsCount: active.length,
      completedEventsCount: completed.length,
      pendingEventsCount: events.filter(e => e.status === 'pending').length,
      totalRSVPs, totalHosted: events.length,
      avgRating:       ratingCount ? parseFloat((ratingSum      / ratingCount).toFixed(1)) : 0,
      engagementScore: ratingCount ? parseFloat((engagementSum  / ratingCount).toFixed(1)) : 0,
    };
  }
}
