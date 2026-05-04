import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Global()
@Module({
  controllers: [NotificationsController],
  providers:   [NotificationsRepository, NotificationsService],
  exports:     [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
