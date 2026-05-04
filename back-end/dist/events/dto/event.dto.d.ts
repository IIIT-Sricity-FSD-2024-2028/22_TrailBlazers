export declare class TimelineSessionDto {
    time: string;
    title: string;
    speaker: string;
    location?: string;
    duration?: string;
    type?: string;
}
export declare class EventStatsDto {
    rsvps?: number;
    checkins?: number;
    engagement?: number;
    rating?: number;
    participationTrend?: number[];
    feedbackScore?: number;
}
export declare class CreateEventDto {
    title: string;
    status: string;
    date: string;
    location: string;
    capacity: number;
    domain: string;
    description: string;
    managerId: string;
    managerName: string;
    timeline?: TimelineSessionDto[];
    stats?: EventStatsDto;
}
export declare class UpdateEventDto {
    title?: string;
    status?: string;
    date?: string;
    location?: string;
    capacity?: number;
    domain?: string;
    description?: string;
    timeline?: TimelineSessionDto[];
    stats?: EventStatsDto;
}
