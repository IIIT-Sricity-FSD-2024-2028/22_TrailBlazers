export declare class CreateNotificationDto {
    title: string;
    desc: string;
    priority: string;
    reporter?: string;
    eventId?: string;
}
export declare class UpdateNotificationDto {
    isRead?: boolean;
    status?: string;
}
