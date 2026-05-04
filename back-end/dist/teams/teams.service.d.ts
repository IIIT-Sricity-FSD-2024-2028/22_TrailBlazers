export interface TeamMember {
    id: string;
    name: string;
    email: string;
    teamRole: 'Scanner Operator' | 'Coordinator' | 'Manager' | 'Support';
    eventId: string;
    status: 'active' | 'break' | 'offline';
    scansCompleted: number;
    createdAt: string;
    updatedAt: string;
}
export declare class TeamsService {
    private readFile;
    private writeFile;
    private nextId;
    findAll(eventId?: string, status?: string): TeamMember[];
    findOne(id: string): TeamMember;
    create(dto: any): TeamMember;
    update(id: string, dto: any): TeamMember;
    remove(id: string): {
        message: string;
    };
    getStats(eventId: string): object;
}
