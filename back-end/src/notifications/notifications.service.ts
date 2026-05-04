import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

const DATA_FILE = path.join(process.cwd(), 'data', 'notifications.json');

@Injectable()
export class NotificationsService {

  private readFile(): Notification[] {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Notification[];
    } catch {
      return [];
    }
  }

  private writeFile(notifications: Notification[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
  }

  private nextId(notifications: Notification[]): string {
    const nums = notifications
      .map((n) => parseInt(n.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `n${max + 1}`;
  }

  findAll(eventId?: string, isRead?: string): Notification[] {
    let result = this.readFile();
    if (eventId) result = result.filter((n) => n.eventId === eventId);
    if (isRead !== undefined) result = result.filter((n) => n.isRead === (isRead === 'true'));
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findOne(id: string): Notification {
    const notif = this.readFile().find((n) => n.id === id);
    if (!notif) throw new NotFoundException(`Notification "${id}" not found`);
    return notif;
  }

  create(dto: any): Notification {
    const notifications = this.readFile();
    const newNotif: Notification = {
      id: this.nextId(notifications),
      title: dto.title,
      desc: dto.desc,
      priority: dto.priority,
      reporter: dto.reporter || 'Team Member',
      eventId: dto.eventId,
      isRead: false,
      status: 'open',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    this.writeFile(notifications);
    return newNotif;
  }

  update(id: string, dto: any): Notification {
    const notifications = this.readFile();
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) throw new NotFoundException(`Notification "${id}" not found`);
    notifications[index] = { ...notifications[index], ...dto };
    this.writeFile(notifications);
    return notifications[index];
  }

  resolve(id: string): Notification {
    return this.update(id, { status: 'resolved', isRead: true });
  }

  remove(id: string): { message: string } {
    const notifications = this.readFile();
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) throw new NotFoundException(`Notification "${id}" not found`);
    notifications.splice(index, 1);
    this.writeFile(notifications);
    return { message: `Notification "${id}" deleted` };
  }

  getUnreadCount(): { count: number } {
    const notifications = this.readFile();
    return { count: notifications.filter((n) => !n.isRead && n.status === 'open').length };
  }
}
