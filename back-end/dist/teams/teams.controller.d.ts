import { TeamsService } from './teams.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team.dto';
export declare class TeamsController {
    private readonly service;
    constructor(service: TeamsService);
    findAll(eventId?: string, status?: string): import("./teams.service").TeamMember[];
    getStats(eventId: string): object;
    findOne(id: string): import("./teams.service").TeamMember;
    create(dto: CreateTeamMemberDto): import("./teams.service").TeamMember;
    update(id: string, dto: UpdateTeamMemberDto): import("./teams.service").TeamMember;
    remove(id: string): {
        message: string;
    };
}
