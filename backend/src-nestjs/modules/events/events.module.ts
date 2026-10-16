import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsRepository } from '../../repositories/events.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { HierarchyModule } from '../hierarchy/hierarchy.module';
import { RevenueModule } from '../revenue/revenue.module';

@Module({
  imports: [NotificationsModule, HierarchyModule, RevenueModule],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
