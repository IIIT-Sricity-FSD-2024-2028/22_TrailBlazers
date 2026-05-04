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
export declare class EventsService {
    private readFile;
    private writeFile;
    private nextId;
    findAll(status?: string, managerId?: string): Event[];
    findOne(id: string): Event;
    create(dto: any): Event;
    update(id: string, dto: any): Event;
    remove(id: string): {
        message: string;
    };
    getDashboardStats(managerId?: string): object;
}
