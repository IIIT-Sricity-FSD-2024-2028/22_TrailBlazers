import { Module } from '@nestjs/common';
import { EventRequestsController } from './event-requests.controller';
import { EventRequestsService } from './event-requests.service';
import { EventRequestsRepository } from '../../repositories/event-requests.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EventRequestsController],
  providers: [EventRequestsService, EventRequestsRepository],
  exports: [EventRequestsService, EventRequestsRepository],
})
export class EventRequestsModule {}
