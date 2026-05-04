import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    findAll(eventId?: string, isRead?: string): import("./notifications.service").Notification[];
    getUnreadCount(): {
        count: number;
    };
    findOne(id: string): import("./notifications.service").Notification;
    create(dto: CreateNotificationDto): import("./notifications.service").Notification;
    update(id: string, dto: UpdateNotificationDto): import("./notifications.service").Notification;
    resolve(id: string): import("./notifications.service").Notification;
    remove(id: string): {
        message: string;
    };
}
