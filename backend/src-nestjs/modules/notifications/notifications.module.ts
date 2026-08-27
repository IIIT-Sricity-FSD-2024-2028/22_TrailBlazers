import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from '../../repositories/notifications.repository';
import { NotificationHelperService } from './notification-helper.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationHelperService,
  ],
  exports: [
    NotificationHelperService,
    NotificationsService,
    NotificationsRepository,
  ],
})
export class NotificationsModule {}
