export interface QnAItem {
    id: string;
    eventId: string;
    question: string;
    askedBy: string;
    answer?: string;
    answeredBy?: string;
    answeredAt?: string;
    status: 'unanswered' | 'answered';
    createdAt: string;
    updatedAt: string;
}
export declare class QnaService {
    private readFile;
    private writeFile;
    private nextId;
    findAll(eventId?: string, status?: string): QnAItem[];
    findOne(id: string): QnAItem;
    findByAttendee(email: string): QnAItem[];
    create(dto: any): QnAItem;
    answer(id: string, dto: any): QnAItem;
    update(id: string, dto: any): QnAItem;
    remove(id: string): {
        message: string;
    };
    getStats(eventId: string): object;
}
