export interface Notification {
    id: string;
    title: string;
    desc: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    reporter: string;
    eventId?: string;
    isRead: boolean;
    status: 'open' | 'resolved';
    time: string;
    createdAt: string;
}
export declare class NotificationsService {
    private readFile;
    private writeFile;
    private nextId;
    findAll(eventId?: string, isRead?: string): Notification[];
    findOne(id: string): Notification;
    create(dto: any): Notification;
    update(id: string, dto: any): Notification;
    resolve(id: string): Notification;
    remove(id: string): {
        message: string;
    };
    getUnreadCount(): {
        count: number;
    };
}
