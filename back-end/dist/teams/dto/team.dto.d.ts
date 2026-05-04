export declare class CreateTeamMemberDto {
    name: string;
    email: string;
    teamRole: string;
    eventId: string;
}
export declare class UpdateTeamMemberDto {
    teamRole?: string;
    status?: string;
    eventId?: string;
}
