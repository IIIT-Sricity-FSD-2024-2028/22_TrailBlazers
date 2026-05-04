import { PollsService } from './polls.service';
import { CreatePollDto, VotePollDto, UpdatePollDto } from './dto/poll.dto';
export declare class PollsController {
    private readonly pollsService;
    constructor(pollsService: PollsService);
    findAll(eventId?: string, status?: string): import("./polls.service").Poll[];
    findOne(id: string): import("./polls.service").Poll;
    getResults(id: string): object;
    create(dto: CreatePollDto): import("./polls.service").Poll;
    vote(id: string, dto: VotePollDto): import("./polls.service").Poll;
    update(id: string, dto: UpdatePollDto): import("./polls.service").Poll;
    close(id: string): import("./polls.service").Poll;
    remove(id: string): {
        message: string;
    };
}
