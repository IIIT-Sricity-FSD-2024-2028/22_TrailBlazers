export interface Rsvp {
    id: string;
    eventId: string;
    name: string;
    email: string;
    phone: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
    ticketCode: string;
    createdAt: string;
    updatedAt: string;
}
export declare class RsvpsService {
    private readFile;
    private writeFile;
    private nextId;
    private nextTicketCode;
    findAll(eventId?: string, status?: string): Rsvp[];
    findOne(id: string): Rsvp;
    findByEmail(email: string): Rsvp[];
    create(dto: any): Rsvp;
    update(id: string, dto: any): Rsvp;
    remove(id: string): {
        message: string;
    };
    checkIn(ticketCode: string): Rsvp;
}
