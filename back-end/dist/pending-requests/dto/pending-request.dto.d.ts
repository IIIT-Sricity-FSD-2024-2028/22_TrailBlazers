export declare class CreatePendingRequestDto {
    name: string;
    location: string;
    expected: number;
    client: string;
    clientEmail: string;
    date: string;
    description: string;
    type: string;
}
export declare class ReviewPendingRequestDto {
    decision: string;
    managerId?: string;
    managerName?: string;
    rejectionReason?: string;
}
