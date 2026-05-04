import { Global, Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsRepository } from '../repositories/events.repository';

@Global()
@Module({
  controllers: [EventsController],
  providers:   [EventsRepository, EventsService],
  exports:     [EventsService, EventsRepository],
})
export class EventsModule {}
