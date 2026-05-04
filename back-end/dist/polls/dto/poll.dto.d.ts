export declare class CreatePollDto {
    eventId: string;
    question: string;
    options: string[];
    createdBy?: string;
}
export declare class VotePollDto {
    option: string;
    voterEmail: string;
}
export declare class UpdatePollDto {
    question?: string;
    options?: string[];
    status?: string;
}
