export interface PendingRequest {
    id: string;
    name: string;
    location: string;
    expected: number;
    client: string;
    clientEmail: string;
    date: string;
    description: string;
    type: 'In-Person' | 'Virtual' | 'Hybrid';
    status: 'Pending' | 'Approved' | 'Rejected';
    managerId?: string;
    managerName?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}
export declare class PendingRequestsService {
    private readFile;
    private writeFile;
    private nextId;
    findAll(status?: string): PendingRequest[];
    findOne(id: string): PendingRequest;
    create(dto: any): PendingRequest;
    review(id: string, dto: any): PendingRequest;
    remove(id: string): {
        message: string;
    };
}
