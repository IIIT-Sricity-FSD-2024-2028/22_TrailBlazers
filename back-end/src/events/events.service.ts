import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface EventTimeline {
  time: string;
  title: string;
  speaker: string;
  location?: string;
  duration?: string;
  type?: string;
}

export interface EventStats {
  rsvps: number;
  checkins: number;
  engagement: number;
  rating: number;
  participationTrend: number[];
  feedbackScore: number;
}

export interface Event {
  id: string;
  title: string;
  status: 'pending' | 'upcoming' | 'live' | 'completed';
  date: string;
  location: string;
  attendees: number;
  capacity: number;
  sessions: number;
  speakers: number;
  managerId: string;
  managerName: string;
  domain: string;
  description: string;
  timeline: EventTimeline[];
  stats: EventStats;
  createdAt: string;
  updatedAt: string;
}

// Data file lives in backend/data/ (OUTSIDE src/) so NestJS watch mode
// never triggers a hot-reload when we write new events.
const DATA_FILE = path.join(process.cwd(), 'data', 'events.json');

@Injectable()
export class EventsService {
  // ── File helpers ────────────────────────────────────────────────────────────

  private readFile(): Event[] {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw) as Event[];
    } catch {
      return [];
    }
  }

  private writeFile(events: Event[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), 'utf-8');
  }

  /** Generate the next ID by finding the highest existing numeric ID suffix */
  private nextId(events: Event[]): string {
    const nums = events
      .map((e) => parseInt(e.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `e${max + 1}`;
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  findAll(status?: string, managerId?: string): Event[] {
    let events = this.readFile();

    // Only filter by status if it is a recognised value (ignore 'all' or unknown strings)
    const validStatuses = ['pending', 'upcoming', 'live', 'completed'];
    if (status && validStatuses.includes(status)) {
      events = events.filter((e) => e.status === status);
    }

    // Only filter by managerId if it looks like a user ID (starts with 'u' + digits)
    if (managerId && /^u\d+$/.test(managerId)) {
      events = events.filter((e) => e.managerId === managerId);
    }

    return events;
  }

  findOne(id: string): Event {
    const events = this.readFile();
    const event = events.find((e) => e.id === id);
    if (!event) throw new NotFoundException(`Event with ID "${id}" not found`);
    return event;
  }

  create(dto: any): Event {
    const events = this.readFile();
    const timeline = dto.timeline || [];
    const uniqueSpeakers = new Set(timeline.map((s: any) => s.speaker)).size;

    const newEvent: Event = {
      id: this.nextId(events),
      title: dto.title,
      status: dto.status || 'pending',
      date: dto.date,
      location: dto.location,
      capacity: dto.capacity,
      domain: dto.domain,
      description: dto.description,
      managerId: dto.managerId,
      managerName: dto.managerName,
      attendees: 0,
      sessions: timeline.length,
      speakers: uniqueSpeakers,
      timeline,
      stats: dto.stats || {
        rsvps: 0,
        checkins: 0,
        engagement: 0,
        rating: 0,
        participationTrend: [],
        feedbackScore: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events.unshift(newEvent);        // add to top of list
    this.writeFile(events);          // ✅ persist to events.json
    return newEvent;
  }

  update(id: string, dto: any): Event {
    const events = this.readFile();
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) throw new NotFoundException(`Event with ID "${id}" not found`);

    const existing = events[index];
    const timeline = dto.timeline !== undefined ? dto.timeline : existing.timeline;
    const uniqueSpeakers = timeline
      ? new Set(timeline.map((s: any) => s.speaker)).size
      : existing.speakers;

    events[index] = {
      ...existing,
      ...dto,
      sessions: timeline ? timeline.length : existing.sessions,
      speakers: uniqueSpeakers,
      timeline,
      updatedAt: new Date().toISOString(),
    };

    this.writeFile(events);          // ✅ persist to events.json
    return events[index];
  }

  remove(id: string): { message: string } {
    const events = this.readFile();
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) throw new NotFoundException(`Event with ID "${id}" not found`);

    events.splice(index, 1);
    this.writeFile(events);          // ✅ persist to events.json
    return { message: `Event "${id}" deleted successfully` };
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  getDashboardStats(managerId?: string): object {
    const all = this.readFile();
    const events = managerId ? all.filter((e) => e.managerId === managerId) : all;

    const active = events.filter((e) => e.status === 'live' || e.status === 'upcoming');
    const completed = events.filter((e) => e.status === 'completed');

    let totalRSVPs = 0;
    let ratingSum = 0;
    let engagementSum = 0;
    let ratingCount = 0;

    events.forEach((e) => {
      if (e.stats) {
        totalRSVPs += e.stats.rsvps || 0;
        if (e.stats.rating) {
          ratingCount++;
          ratingSum += e.stats.rating;
          engagementSum += e.stats.engagement || 0;
        }
      }
    });

    return {
      totalEvents: events.length,
      activeEventsCount: active.length,
      completedEventsCount: completed.length,
      pendingEventsCount: events.filter((e) => e.status === 'pending').length,
      totalRSVPs,
      avgRating: ratingCount ? parseFloat((ratingSum / ratingCount).toFixed(1)) : 0,
      engagementScore: ratingCount ? parseFloat((engagementSum / ratingCount).toFixed(1)) : 0,
      totalHosted: events.length,
    };
  }
}
