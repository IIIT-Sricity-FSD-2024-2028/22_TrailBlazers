import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    findAll(status?: string, managerId?: string): import("./events.service").Event[];
    getDashboardStats(managerId?: string): object;
    findOne(id: string): import("./events.service").Event;
    create(dto: CreateEventDto): import("./events.service").Event;
    update(id: string, dto: UpdateEventDto): import("./events.service").Event;
    patch(id: string, dto: UpdateEventDto): import("./events.service").Event;
    remove(id: string): {
        message: string;
    };
}
