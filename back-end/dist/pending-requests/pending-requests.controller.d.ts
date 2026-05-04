import { PendingRequestsService } from './pending-requests.service';
import { CreatePendingRequestDto, ReviewPendingRequestDto } from './dto/pending-request.dto';
export declare class PendingRequestsController {
    private readonly service;
    constructor(service: PendingRequestsService);
    findAll(status?: string): import("./pending-requests.service").PendingRequest[];
    findOne(id: string): import("./pending-requests.service").PendingRequest;
    create(dto: CreatePendingRequestDto): import("./pending-requests.service").PendingRequest;
    review(id: string, dto: ReviewPendingRequestDto): import("./pending-requests.service").PendingRequest;
    remove(id: string): {
        message: string;
    };
}
