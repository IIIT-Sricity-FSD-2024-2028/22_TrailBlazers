import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  findAll(eventId?: string, isRead?: string) {
    return this.repo.store
      .filter(n => {
        if (eventId && n.eventId !== eventId) return false;
        if (isRead !== undefined && n.isRead !== (isRead === 'true')) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findOne(id: string) {
    const n = this.repo.findById(id);
    if (!n) throw new NotFoundException(`Notification "${id}" not found`);
    return n;
  }

  create(dto: any) {
    return this.repo.save({
      id:       this.repo.nextNotificationId(),
      title:    dto.title,
      desc:     dto.desc,
      priority: dto.priority,
      reporter: dto.reporter || 'Team Member',
      eventId:  dto.eventId,
      isRead:   false,
      status:   'open',
      time:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    });
  }

  update(id: string, dto: any) {
    this.findOne(id);
    return this.repo.update(id, dto)!;
  }

  resolve(id: string) { return this.update(id, { status: 'resolved', isRead: true }); }

  remove(id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Notification "${id}" not found`);
    this.repo.delete(id);
    return { message: `Notification "${id}" deleted` };
  }

  getUnreadCount() {
    return { count: this.repo.store.filter(n => !n.isRead && n.status === 'open').length };
  }
}
