import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { NotificationsRepository } from '../../repositories/notifications.repository';
import { InteractNotificationDto } from './dto/interact-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepo: NotificationsRepository) {}

  getUserNotifications(userId: string, limit = 50) {
    const parsedLimit = parseInt(limit as any, 10) || 50;
    const notifications = this.notificationsRepo.getUserNotifications(
      userId,
      parsedLimit,
    );
    const unreadCount = this.notificationsRepo.getUnreadCount(userId);
    return { notifications, unreadCount };
  }

  getPendingPopups(userId: string) {
    const pendingPopups = this.notificationsRepo.getPendingPopups(userId);
    return { pendingPopups };
  }

  getUnreadCount(userId: string) {
    const unreadCount = this.notificationsRepo.getUnreadCount(userId);
    return { unreadCount };
  }

  interactNotification(
    userId: string,
    notificationId: string,
    dto: InteractNotificationDto,
  ) {
    const targetAction = dto.action || 'EXPIRE';
    const success = this.notificationsRepo.interactNotification(
      userId,
      notificationId,
      targetAction,
    );

    if (!success) {
      throw new ForbiddenException(
        'Notification not found or access denied.',
      );
    }

    const unreadCount = this.notificationsRepo.getUnreadCount(userId);
    return { success: true, action: targetAction, unreadCount };
  }

  autoExpirePending(userId: string) {
    const expiredCount = this.notificationsRepo.autoExpirePending(userId);
    const unreadCount = this.notificationsRepo.getUnreadCount(userId);
    return { success: true, expiredCount, unreadCount };
  }

  markNotificationAsRead(userId: string, notificationId: string) {
    const success = this.notificationsRepo.markAsRead(userId, notificationId);
    if (!success) {
      throw new ForbiddenException(
        'Notification not found or access denied.',
      );
    }

    const unreadCount = this.notificationsRepo.getUnreadCount(userId);
    return {
      success: true,
      unreadCount,
      message: 'Notification marked as read.',
    };
  }

  markAllNotificationsAsRead(userId: string) {
    const updatedCount = this.notificationsRepo.markAllAsRead(userId);
    return {
      success: true,
      updatedCount,
      unreadCount: 0,
      message: 'All notifications marked as read.',
    };
  }

  clearAllNotifications(userId: string) {
    try {
      const clearedCount = this.notificationsRepo.clearAllNotifications(userId);
      return {
        success: true,
        clearedCount,
        unreadCount: 0,
        message: 'All missed notifications cleared.',
      };
    } catch (err: any) {
      throw new InternalServerErrorException(
        'Failed to clear notifications.',
      );
    }
  }

  deleteNotification(userId: string, notificationId: string) {
    const success = this.notificationsRepo.deleteNotification(
      userId,
      notificationId,
    );
    if (!success) {
      throw new ForbiddenException(
        'Notification not found or access denied.',
      );
    }

    const unreadCount = this.notificationsRepo.getUnreadCount(userId);
    return {
      success: true,
      unreadCount,
      message: 'Notification deleted.',
    };
  }
}
