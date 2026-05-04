export interface PollOption {
    label: string;
    votes: number;
    voters: string[];
}
export interface Poll {
    id: string;
    eventId: string;
    question: string;
    options: PollOption[];
    status: 'open' | 'closed';
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}
export declare class PollsService {
    private readFile;
    private writeFile;
    private nextId;
    findAll(eventId?: string, status?: string): Poll[];
    findOne(id: string): Poll;
    findByEvent(eventId: string): Poll[];
    create(dto: any): Poll;
    vote(id: string, dto: any): Poll;
    update(id: string, dto: any): Poll;
    close(id: string): Poll;
    remove(id: string): {
        message: string;
    };
    getResults(id: string): object;
}
