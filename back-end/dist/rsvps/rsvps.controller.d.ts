import { RsvpsService } from './rsvps.service';
import { CreateRsvpDto, UpdateRsvpDto } from './dto/rsvp.dto';
export declare class RsvpsController {
    private readonly rsvpsService;
    constructor(rsvpsService: RsvpsService);
    findAll(eventId?: string, status?: string): import("./rsvps.service").Rsvp[];
    findMyRsvps(email: string): import("./rsvps.service").Rsvp[];
    findOne(id: string): import("./rsvps.service").Rsvp;
    create(dto: CreateRsvpDto): import("./rsvps.service").Rsvp;
    update(id: string, dto: UpdateRsvpDto): import("./rsvps.service").Rsvp;
    checkIn(ticketCode: string): import("./rsvps.service").Rsvp;
    remove(id: string): {
        message: string;
    };
}
