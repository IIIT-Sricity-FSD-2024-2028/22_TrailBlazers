import { Module } from '@nestjs/common';
import { EventManagerController } from './event-manager.controller';
import { EventManagerService } from './event-manager.service';
import { EventManagerRepository } from '../../repositories/event-manager.repository';
import { QuotationsRepository } from '../../repositories/quotations.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EventManagerController],
  providers: [
    EventManagerService,
    EventManagerRepository,
    QuotationsRepository,
  ],
  exports: [EventManagerService, EventManagerRepository],
})
export class EventManagerModule {}
